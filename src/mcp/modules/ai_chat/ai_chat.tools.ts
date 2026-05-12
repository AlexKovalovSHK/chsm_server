import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '../../decorators';
import { AiBridgeService } from '../../services/ai-bridge.service';
import { z } from 'zod';

@Injectable()
export class AiChatMcpTool {
  private readonly logger = new Logger(AiChatMcpTool.name);

  constructor(private readonly aiBridgeService: AiBridgeService) {}

  @Tool({
    name: 'general-query',
    description:
      'Answer general questions, provide explanations, or chat about topics not related to the specific school management system or user data. Use this for general knowledge, creative writing, or general assistance.',
    parameters: z.object({
      query: z.string().describe('The user question or message to respond to'),
      model: z
        .enum(['openai', 'gemini', 'deepseek'])
        .optional()
        .default('openai')
        .describe('Preferred AI model to use for the response'),
    }),
  })
  async handleGeneralQuery({
    query,
    model,
  }: {
    query: string;
    model?: 'openai' | 'gemini' | 'deepseek';
  }) {
    try {
      this.logger.debug(`MCP general-query using model ${model}: ${query}`);

      // We use chatSimple to avoid the specialized academy system prompt and recursive tool calling.
      // This is for general knowledge queries only.
      const messages = [{ role: 'user', content: query }];
      const response = await this.aiBridgeService.chatSimple(
        model || 'openai',
        messages,
      );

      return { response };
    } catch (err: any) {
      this.logger.error(`Error in general-query tool: ${err.message}`);
      return { error: err.message };
    }
  }
}
