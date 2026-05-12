import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '../../decorators';
import { BotApiService } from '../../../telegram/service/bot-api.service';
import { ClassroomService } from '../../../classroom/service/classroom.service';
import { z } from 'zod';

@Injectable()
export class TelegramMcpTool {
  private readonly logger = new Logger(TelegramMcpTool.name);

  constructor(
    private readonly botApiService: BotApiService,
    private readonly classroomService: ClassroomService,
  ) {}

  @Tool({
    name: 'send-telegram-message',
    description: 'Send a private message to a user via Telegram bot.',
    parameters: z.object({
      tgId: z.string().describe('The Telegram ID of the recipient'),
      text: z.string().describe('The message text to send'),
    }),
  })
  async sendTelegramMessage({ tgId, text }: { tgId: string; text: string }) {
    try {
      this.logger.debug(`MCP sending Telegram message to ${tgId}`);
      await this.botApiService.sendMessage(tgId, text);
      return { success: true, message: `Message sent to Telegram ID ${tgId}` };
    } catch (err: any) {
      this.logger.error(`Error sending Telegram message: ${err.message}`);
      return { error: err.message };
    }
  }

  @Tool({
    name: 'send-email',
    description: 'Send an email to a user via Google Classroom system account.',
    parameters: z.object({
      to: z.string().email().describe('Recipient email address'),
      subject: z.string().describe('Email subject line'),
      text: z
        .string()
        .describe('The email message content (plain text or HTML)'),
    }),
  })
  async sendEmail({
    to,
    subject,
    text,
  }: {
    to: string;
    subject: string;
    text: string;
  }) {
    try {
      this.logger.debug(`MCP sending Email to ${to}`);
      await this.classroomService.sendEmail(to, subject, text);
      return { success: true, message: `Email sent to ${to}` };
    } catch (err: any) {
      this.logger.error(`Error sending email: ${err.message}`);
      return { error: err.message };
    }
  }

  @Tool({
    name: 'announce-to-all-courses',
    description:
      'Post an announcement to the stream of all active Google Classroom courses.',
    parameters: z.object({
      text: z.string().describe('The announcement text'),
    }),
  })
  async announceToAll({ text }: { text: string }) {
    try {
      this.logger.debug('MCP announcing to all courses');
      const adminTokens = await this.classroomService.getAdminTokens();
      if (!adminTokens) return { error: 'System not authorized with Google' };

      const results = await this.classroomService.postAnnouncementToAll(
        adminTokens,
        text,
      );
      return { success: true, results };
    } catch (err: any) {
      this.logger.error(`Error posting announcements: ${err.message}`);
      return { error: err.message };
    }
  }
}
