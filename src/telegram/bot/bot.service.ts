// src/telegram/bot.service.ts
import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { Bot, Context } from 'grammy';

@Injectable()
export class BotService implements OnModuleInit {
    private readonly logger = new Logger(BotService.name);
  constructor(@Inject('TELEGRAM_BOT') private readonly bot: Bot) {}

  onModuleInit() {
    this.bot.start();
    this.logger.log('🤖 Telegram Bot started');

    // Обработка /start
    this.bot.command('start', (ctx) => {
      ctx.reply('Привет! Чтобы привязать свой Google Classroom, нажми на /login');
    });

    // ОБРАБОТКА /login (Добавьте этот блок)
    this.bot.command('login', async (ctx) => {
      this.logger.log(`Команда /login от пользователя ${ctx.from?.id}`);
      
      try {
        const tgId = ctx.from?.id.toString();
        if (!tgId) return;

        // Генерируем ссылку. Убедитесь, что ваш бэкенд доступен извне или вы используете localhost для тестов
        //const loginUrl = `http://localhost:5001/auth/login?tgId=${tgId}`;
        const loginUrl = `http://127.0.0.1:5001/auth/login?tgId=${tgId}`;

        await ctx.reply('Нажми на кнопку ниже, чтобы авторизоваться через Google:', {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🔐 Войти в Google Classroom', url: loginUrl }
              ]
            ]
          }
        });
      } catch (e) {
        this.logger.error(`Ошибка в команде /login: ${e.message}`);
        ctx.reply('Произошла ошибка при генерации ссылки. Попробуй позже.');
      }
    });
  }

  async sendNewTasksNotification(tgId: string, tasks: any[]) {
    const message =
      `🔔 *Новые задания!*\n\n` +
      tasks.map((t) => `🔹 ${t.title} (${t.courseName})`).join('\n');

    const keyboard = {
      inline_keyboard: tasks.map((t) => [
        { text: `Открыть: ${t.title}`, url: t.link },
      ]),
    };

    try {
      await this.bot.api.sendMessage(tgId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (e) {
      console.error('Ошибка отправки в TG:', e);
    }
  }

  async sendLoginLink(ctx: Context) {
    var tgId = '';

    if (ctx.from) {
      tgId = ctx.from.id.toString();
    }

    const loginUrl = `http://localhost:5001/auth/login?tgId=${tgId}`;

    await ctx.reply(
      'Чтобы я мог присылать тебе задания и считать XP, привяжи свой Google Classroom:',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔐 Авторизоваться через Google', url: loginUrl }],
          ],
        },
      },
    );
  }
}
