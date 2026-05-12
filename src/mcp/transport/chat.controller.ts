import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  Sse,
  Res,
} from '@nestjs/common';
import express from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiBridgeService } from '../services/ai-bridge.service';
import { McpRegistryService } from '../services/mcp-registry.service';
import { AUDIO_MIME_TYPES } from '../constants/audio-mime-types';
import { Observable } from 'rxjs';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly aiBridge: AiBridgeService,
    private readonly registry: McpRegistryService,
  ) {}

  @Post('stream')
  @Sse('stream')
  async chatStream(
    @Body() body: { model?: string; messages: any[] },
    @Headers('authorization') authHeader: string,
    @Res() res: express.Response,
  ) {
    const token = authHeader?.replace('Bearer ', '') ?? '';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const generator = this.aiBridge.chatOpenAIStream(
      body.messages || [],
      token,
    );

    for await (const chunk of generator) {
      res.write(`data: ${chunk}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  }

  @Post()
  async chat(
    @Body() body: { model?: string; messages: any[] },
    // ← токен извлекается из заголовка Authorization: Bearer <token>
    @Headers('authorization') authHeader: string,
  ) {
    const token = authHeader?.replace('Bearer ', '') ?? '';
    const response = await this.aiBridge.chat(
      body.model || 'openai',
      body.messages,
      token,
    );
    return { response };
  }

  @Post('voice')
  @UseInterceptors(FileInterceptor('file'))
  async voice(
    @UploadedFile() file: any,
    @Body() body: { accountId?: string; projectId?: string },
    @Headers('authorization') auth: string,
  ) {
    if (!file) {
      throw new HttpException('Audio file is required', HttpStatus.BAD_REQUEST);
    }

    const token = auth?.replace('Bearer ', '') ?? '';

    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? 'webm';
    const mimeType = AUDIO_MIME_TYPES[ext] ?? 'audio/webm';

    let transcribedText: string;
    try {
      transcribedText = await this.aiBridge.transcribe(file.buffer, mimeType);
    } catch (err) {
      throw new HttpException(
        `Transcription failed: ${(err as Error).message}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    console.log(`[Voice] Transcribed: "${transcribedText}"`);

    const systemContext = `Systemkontext: accountId=${body.accountId || 'unbekannt'}, projektId=${body.projectId || 'unbekannt'}. Antworte всегда на немецком языке.`;

    const messages = [
      {
        role: 'user',
        content: systemContext,
      },
      {
        role: 'assistant',
        content:
          'Verstanden, я буду использовать эти ID автоматически и отвечать по-немецки.',
      },
      {
        role: 'user',
        content: transcribedText,
      },
    ];

    const response = await this.aiBridge.chat('gemini', messages, token);
    return { response };
  }

  @Get('config')
  getConfig() {
    const mcpModuleIds = this.registry.getMcpModuleIds();
    const allTools = mcpModuleIds.flatMap((id) =>
      this.registry.getTools(id).map((t) => ({
        name: t.metadata.name,
        description: t.metadata.description,
      })),
    );

    return {
      appName: 'CHSM-Classroom-MCP',
      models: ['openai/gpt-oss-20b', 'gemini', 'deepseek'],
      tools: allTools,
    };
  }
}
