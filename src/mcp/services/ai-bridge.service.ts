import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { McpRegistryService } from './mcp-registry.service';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { toJsonSchemaCompat } from '@modelcontextprotocol/sdk/server/zod-json-schema-compat.js';
import { normalizeObjectSchema } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import { SYSTEM_PROMPT } from '../utils/prompts';

@Injectable()
export class AiBridgeService {
  private readonly logger = new Logger(AiBridgeService.name);
  private readonly model: string;

  constructor(
    private readonly registry: McpRegistryService,
    private readonly moduleRef: ModuleRef,
    private readonly config: ConfigService,
  ) {
    this.model = this.config.get<string>('GEMINI_MODEL', 'openai/gpt-oss-20b');
  }

  /**
   * Главная точка входа. Всегда возвращает строку.
   */
  async chat(
    model: 'gemini' | 'deepseek' | 'openai' | string,
    messages: any[],
    token: string,
  ): Promise<string> {
    // 1. Проверяем, есть ли уже системное сообщение в истории
    const hasSystem = messages.some((m) => m.role === 'system');
    const finalMessages = hasSystem
      ? messages
      : [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

    try {
      if (model === 'gemini') {
        this.logger.log('Starting chat with Gemini');
        return await this.chatGemini(finalMessages, token);
      } else if (model === 'deepseek') {
        this.logger.log('Starting chat with Deepseek');
        return await this.chatDeepseek(finalMessages, token);
      } else {
        this.logger.log(`Starting blocking chat with model: ${this.model}`);
        return await this.chatOpenAI(finalMessages, token);
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Chat error: ${error.message}`);
      throw new HttpException(
        { message: error.message || 'Internal server error', status: 'ERROR' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Simple chat method for tool-less and system-prompt-less interactions.
   * Useful for general queries or when a clean context is needed.
   */
  async chatSimple(
    model: 'gemini' | 'deepseek' | 'openai' | string,
    messages: any[],
  ): Promise<string> {
    try {
      if (model === 'gemini') {
        return await this.chatGemini(messages, '', false);
      } else if (model === 'deepseek') {
        return await this.chatDeepseek(messages, '', false);
      } else {
        return await this.chatOpenAI(messages, '', false);
      }
    } catch (error) {
      this.logger.error(`Simple chat error: ${error.message}`);
      throw new HttpException(
        {
          message: error.message || 'Error during simple chat',
          status: 'ERROR',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async *chatOpenAIStream(
    messages: any[],
    token: string,
  ): AsyncGenerator<string, void, unknown> {
    yield 'Streaming is not implemented yet';
  }

  async transcribe(buffer: Buffer, mimeType: string): Promise<string> {
    return 'Transcription is not implemented yet';
  }

  /**
   * Маппинг сообщений для Google Gemini
   */
  private mapMessagesToGemini(messages: any[]) {
    return messages.map((m) => {
      // Ответ от инструмента
      if (m.role === 'function' || m.role === 'tool') {
        return {
          role: 'function',
          parts: [
            {
              functionResponse: {
                name: m.name,
                response: { result: m.content },
              },
            },
          ],
        };
      }

      const parts: any[] = [];

      // Если в истории был вызов функции ассистентом
      if (m.function_call) {
        parts.push({
          functionCall: {
            name: m.function_call.name,
            args: m.function_call.args,
          },
        });
      }

      // Обычный текст
      if (m.content) {
        parts.push({ text: m.content });
      }

      // Gemini требует, чтобы части не были пустыми
      if (parts.length === 0) parts.push({ text: '' });

      return {
        role: m.role === 'user' || m.role === 'system' ? 'user' : 'model',
        parts: parts,
      };
    });
  }

  /**
   * OpenAI / Nvidia Logic
   */
  private async chatOpenAI(
    messages: any[],
    token: string,
    useTools = true,
  ): Promise<string> {
    const apiKey = this.config.get<string>('NVIDIA_API_KEY');
    const mcpModuleId = this.registry.getMcpModuleIds()[0];
    const tools = useTools
      ? this.registry.getTools(mcpModuleId).map((t) => ({
          type: 'function',
          function: {
            name: t.metadata.name,
            description: t.metadata.description,
            parameters: this.zodToJsonSchema(t.metadata.parameters),
          },
        }))
      : [];

    const url = 'https://integrate.api.nvidia.com/v1/chat/completions';

    const callApi = async (msgs: any[]) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: msgs,
          tools: tools.length > 0 ? tools : undefined,
          tool_choice: tools.length > 0 ? 'auto' : undefined,
          stream: false,
        }),
      });

      const responseText = await res.text();

      if (!res.ok) {
        this.logger.error(
          `Nvidia API Error (${res.status}): ${responseText.substring(0, 500)}`,
        );
        throw new HttpException(
          {
            status: 'NVIDIA_ERROR',
            originalStatus: res.status,
            details: responseText.startsWith('{')
              ? JSON.parse(responseText)
              : responseText,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      try {
        return JSON.parse(responseText);
      } catch (e) {
        this.logger.error(
          `Failed to parse Nvidia JSON: ${responseText.substring(0, 500)}`,
        );
        throw new HttpException(
          {
            status: 'INVALID_JSON_RESPONSE',
            message: 'API returned invalid JSON',
            details: responseText.substring(0, 500),
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    };

    let data = await callApi(messages);

    while (data.choices?.[0]?.message?.tool_calls?.length > 0) {
      const aiMessage = data.choices[0].message;
      const toolCalls = aiMessage.tool_calls;

      // Добавляем вызов в историю
      messages.push(aiMessage);

      for (const toolCall of toolCalls) {
        let args: any;
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          this.logger.error(
            `Failed to parse tool arguments: ${toolCall.function.arguments}`,
          );
          throw new HttpException(
            {
              status: 'AI_INVALID_ARGUMENTS',
              message: 'AI returned invalid JSON for tool arguments',
              raw: toolCall.function.arguments,
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        const result = await this.executeToolInternal(
          mcpModuleId,
          toolCall.function.name,
          { ...args, token },
        );

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: JSON.stringify(result),
        });
      }
      data = await callApi(messages);
    }

    const message = data.choices?.[0]?.message;
    if (!message) return '';

    const reasoning = message.reasoning_content || message.reasoning || '';
    const content = message.content || '';

    // Защита от дублирования reasoning в content
    if (content.includes(reasoning) && reasoning.length > 30) {
      return content;
    }

    return reasoning
      ? `<thought>\n${reasoning}\n</thought>\n\n${content}`
      : content;
  }

  /**
   * Gemini Logic
   */
  private async chatGemini(
    messages: any[],
    token: string,
    useTools = true,
  ): Promise<string> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    const mcpModuleId = this.registry.getMcpModuleIds()[0];
    const tools = useTools
      ? this.registry.getTools(mcpModuleId).map((t) => ({
          name: t.metadata.name,
          description: t.metadata.description,
          parameters: t.metadata.parameters,
        }))
      : [];

    const geminiTools =
      tools.length > 0
        ? [
            {
              function_declarations: tools.map((t) => ({
                name: t.name,
                description: t.description,
                parameters: this.zodToJsonSchema(t.parameters),
              })),
            },
          ]
        : [];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`;

    let data = await this.postToGemini(url, {
      contents: this.mapMessagesToGemini(messages),
      tools: geminiTools,
    });

    while (
      data.candidates?.[0]?.content?.parts?.some((p: any) => p.functionCall)
    ) {
      const part = data.candidates[0].content.parts.find(
        (p: any) => p.functionCall,
      );
      const call = part.functionCall;

      const result = await this.executeToolInternal(mcpModuleId, call.name, {
        ...call.args,
        token,
      });

      // Сохраняем и вызов, и ответ в истории
      messages.push({ role: 'assistant', content: '', function_call: call });
      messages.push({
        role: 'function',
        content: JSON.stringify(result),
        name: call.name,
      });

      data = await this.postToGemini(url, {
        contents: this.mapMessagesToGemini(messages),
        tools: geminiTools,
      });
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * Deepseek Logic
   */
  private async chatDeepseek(
    messages: any[],
    token: string,
    useTools = true,
  ): Promise<string> {
    const apiKey = this.config.get<string>('DEEPSEEK_API_KEY');
    const mcpModuleId = this.registry.getMcpModuleIds()[0];
    const url = 'https://api.deepseek.com/chat/completions';

    const tools = useTools
      ? this.registry.getTools(mcpModuleId).map((t) => ({
          type: 'function',
          function: {
            name: t.metadata.name,
            description: t.metadata.description,
            parameters: this.zodToJsonSchema(t.metadata.parameters),
          },
        }))
      : [];

    const callApi = async (msgs: any[]) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: msgs,
          tools: tools.length > 0 ? tools : undefined,
          tool_choice: tools.length > 0 ? 'auto' : undefined,
        }),
      });
      return await res.json();
    };

    let data = await callApi(messages);

    while (data.choices?.[0]?.message?.tool_calls?.length > 0) {
      const aiMessage = data.choices[0].message;
      const toolCalls = aiMessage.tool_calls;

      // Add call to history
      messages.push(aiMessage);

      for (const toolCall of toolCalls) {
        this.logger.debug(
          `Deepseek calling tool: ${toolCall.function.name} with args: ${toolCall.function.arguments}`,
        );
        let args: any;
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          this.logger.error(
            `Failed to parse tool arguments from Deepseek: ${toolCall.function.arguments}`,
          );
          throw new HttpException(
            {
              status: 'AI_INVALID_ARGUMENTS',
              message: 'Deepseek returned invalid JSON for tool arguments',
              raw: toolCall.function.arguments,
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        const result = await this.executeToolInternal(
          mcpModuleId,
          toolCall.function.name,
          { ...args, token },
        );
        this.logger.debug(
          `Deepseek tool ${toolCall.function.name} returned: ${JSON.stringify(result)}`,
        );

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: JSON.stringify(result),
        });
      }

      data = await callApi(messages);
    }

    return data.choices?.[0]?.message?.content || '';
  }

  private async postToGemini(url: string, body: any) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new HttpException(
        `Gemini Error: ${errorText}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return await response.json();
  }

  private async executeToolInternal(
    mcpModuleId: string,
    name: string,
    args: any,
  ) {
    const sanitizedName = name.split('<|')[0]?.trim() || name;
    const toolInfo = this.registry.findTool(mcpModuleId, sanitizedName);
    if (!toolInfo) throw new Error(`Tool ${sanitizedName} not found`);

    const instance = await this.moduleRef.get(toolInfo.providerClass, {
      strict: false,
    });
    return instance[toolInfo.methodName](args);
  }

  private zodToJsonSchema(schema: any): any {
    const normalized = normalizeObjectSchema(schema);
    if (!normalized) return { type: 'object', properties: {} };
    const { $schema, additionalProperties, ...clean } = toJsonSchemaCompat(
      normalized,
    ) as any;

    if (clean.properties?.token) {
      delete clean.properties.token;
      clean.required = (clean.required ?? []).filter(
        (r: string) => r !== 'token',
      );
    }
    return clean;
  }
}
