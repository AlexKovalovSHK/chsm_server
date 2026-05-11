import { Controller, Post, Body, Sse, MessageEvent, HttpException, HttpStatus, Logger, Res } from '@nestjs/common';
import { Observable } from 'rxjs';
import express from 'express';

@Controller('nvidia-test')
export class NvidiaTestController {
  private readonly logger = new Logger(NvidiaTestController.name);
  private readonly INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
  private readonly API_KEY = process.env.KIMI_API_KEY || '';

  // ── Вспомогательный метод: общий SSE-стрим к NVIDIA API ──────────────────
  private createStream(
    res: express.Response,
    model: string,
    content: string,
    options: Record<string, unknown> = {},
  ): Observable<MessageEvent> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    return new Observable((observer) => {
      if (!this.API_KEY) {
        observer.error(new Error('NVIDIA_API_KEY is not defined in .env'));
        return;
      }

      (async () => {
        try {
          const response = await fetch(this.INVOKE_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.API_KEY}`,
              'Accept': 'text/event-stream',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: content || 'Привет!' }],
              stream: true,
              ...options,
            }),
          });

          if (!response.ok) {
            const errorBody = await response.text();
            this.logger.error(`Nvidia API error: ${errorBody}`);
            observer.error(new Error(`Nvidia API returned ${response.status}`));
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) {
            observer.error(new Error('Response body is not readable'));
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === 'data: [DONE]') continue;

              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.substring(6);
                try {
                  const json = JSON.parse(jsonStr);
                  const delta = json.choices?.[0]?.delta;

                  if (delta) {
                    const reasoning = delta.reasoning_content || '';
                    const text = delta.content || '';

                    if (reasoning || text) {
                      observer.next({
                        data: { reasoning, content: text },
                      } as MessageEvent);
                    }
                  }
                } catch (_) {
                  // Игнорируем неполные/мета-строки
                }
              }
            }
          }

          observer.complete();
        } catch (err) {
          this.logger.error('Streaming error', err.stack);
          observer.error(err);
        }
      })();
    });
  }

  // ── POST /nvidia-test/chat  →  Kimi K2 Thinking (стрим) ──────────────────
  @Post('chat')
  @Sse('chat')
  streamChat(
    @Body('content') content: string,
    @Res() res: express.Response,
  ): Observable<MessageEvent> {
    return this.createStream(res, 'moonshotai/kimi-k2-thinking', content, {
      max_tokens: 16384,
      temperature: 1.0,
      top_p: 0.9,
    });
  }

  // ── POST /nvidia-test/gpt-oss  →  gpt-oss-20b (стрим) ───────────────────
  /**
   * reasoning_effort: 'low' | 'medium' | 'high'
   *   low    — быстрые ответы, общий диалог
   *   medium — баланс скорости и качества (по умолчанию)
   *   high   — глубокий анализ, сложные задачи
   */
  @Post('gpt-oss')
  @Sse('gpt-oss')
  streamGptOss(
    @Body('content') content: string,
    @Body('reasoning_effort') reasoningEffort: 'low' | 'medium' | 'high' = 'medium',
    @Res() res: express.Response,
  ): Observable<MessageEvent> {
    return this.createStream(res, 'openai/gpt-oss-20b', content, {
      max_tokens: 16384,
      temperature: 1.0,
      top_p: 0.9,
      // gpt-oss поддерживает управление глубиной рассуждений
      // передаётся через системный промпт в формате harmony
      messages: [
        {
          role: 'system',
          content: `Reasoning: ${reasoningEffort}`,
        },
        {
          role: 'user',
          content: content || 'Привет!',
        },
      ],
    });
  }

  // ── POST /nvidia-test/ask  →  Llama 3.1 8B (без стрима) ─────────────────
  @Post('ask')
  async ask(@Body('content') content: string) {
    try {
      const response = await fetch(this.INVOKE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta/llama-3.1-8b-instruct',
          messages: [{ role: 'user', content: content || 'Привет!' }],
          max_tokens: 2048,
          temperature: 0.7,
          top_p: 1.0,
          stream: false,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new HttpException(`NVIDIA API Error: ${error}`, response.status);
      }

      const data = await response.json();

      return {
        success: true,
        answer: data.choices[0]?.message?.content || '',
        usage: data.usage,
      };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}