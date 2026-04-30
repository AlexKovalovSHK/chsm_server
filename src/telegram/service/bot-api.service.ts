// bot-api.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as https from 'https';
import * as http from 'http';

@Injectable()
export class BotApiService {
  private readonly botUrl = process.env.BOT_SERVICE_URL; // http://vps-bot-ip:port
  private readonly apiKey = process.env.BOT_SERVICE_API_KEY;

  private getHttpModule(url: string): typeof http | typeof https {
    return url.startsWith('https') ? https : http;
  }

  async sendMessage(tgId: string, text: string) {
    const url = new URL(`${this.botUrl}/bot/send-message`);
    const httpModule = this.getHttpModule(url.toString());

    const postData = JSON.stringify({ tgId, text });

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    return new Promise((resolve, reject) => {
      const req = httpModule.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
              reject({
                response: {
                  status: res.statusCode,
                  data: parsedData,
                },
              });
            } else {
              resolve(parsedData);
            }
          } catch (error) {
            reject({
              response: {
                status: res.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
                data: { message: 'Invalid JSON response' },
              },
            });
          }
        });
      });

      req.on('error', (error) => {
        reject({
          response: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            data: { message: error.message },
          },
        });
      });

      req.write(postData);
      req.end();
    }).catch((error) => {
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.response?.data?.message || 'Bot service error';
      throw new HttpException(message, status);
    });
  }
}