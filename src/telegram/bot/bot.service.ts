import {
  Injectable,
  Inject,
  OnModuleInit,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { Bot } from 'grammy';
import { UserTgService } from '../../users_tg/services/user_tg.service';

@Injectable()
export class BotService implements OnModuleInit {
  private readonly logger = new Logger(BotService.name);

  // 1. Флаг для предотвращения двойного запуска (защита от ошибки 409)
  private static isBotStarted = false;

  constructor(
    @Inject('TELEGRAM_BOT') private readonly bot: Bot,
    @Inject(forwardRef(() => UserTgService)) // Используйте forwardRef, если есть цикличность
    private readonly userService: UserTgService,
  ) {}

  async onModuleInit() {
    // Если бот уже запущен в этом процессе — выходим
    if (BotService.isBotStarted) {
      return;
    }

    // Middleware: сохранение данных юзера
    this.bot.use(async (ctx, next) => {
      if (ctx.from) {
        await this.userService.upsertUser({
          tgId: ctx.from.id.toString(),
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name,
        });
      }
      return next();
    });

    // Команда /start
    this.bot.command('start', async (ctx) => {
      const tgId = ctx.from!.id.toString();

      // Используем findByTgId для поиска по Telegram ID
      const user = await this.userService.findByTgId(tgId);

      if (user?.isVerified) {
        return ctx.reply(
          `Вы уже зарегистрированы как ${user.email}. Ожидайте новых заданий!`,
        );
      }

      await this.userService.updateRegistrationStep(tgId, 'waiting_email');

      await ctx.reply(
        `Привет, ${ctx.from?.first_name}! 👋\n\n` +
          'Я буду присылать тебе задания из учебной платформы прямо сюда.\n' +
          'Для начала регистрации, пожалуйста, **введи свой Email:**',
        { parse_mode: 'Markdown' },
      );
    });

    // Обработка ввода Email
    this.bot.on('message:text', async (ctx) => {
      const tgId = ctx.from.id.toString();
      const text = ctx.message.text.trim();

      // Используем findByTgId
      const user = await this.userService.findByTgId(tgId);

      if (user?.registrationStep === 'waiting_email') {
        await this.handleEmailInput(ctx, tgId, text);
      } else {
        await ctx.reply(
          'Используйте меню или команду /start для начала работы.',
        );
      }
    });

    // ЗАПУСК БОТА С ОБРАБОТКОЙ ОШИБОК
    try {
      // mark as started BEFORE calling start to prevent race conditions
      BotService.isBotStarted = true;

      // Не используйте await перед start(), grammy сама управляет циклом.
      this.bot.start({
        onStart: (info) => {
          this.logger.log(
            `🤖 Бот @${info.username} успешно запущен в Telegram`,
          );
        },
      });
    } catch (e) {
      BotService.isBotStarted = false;
      this.logger.error(`Ошибка запуска бота: ${e.message}`);
    }
  }

  private async handleEmailInput(ctx: any, tgId: string, email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ctx.reply('⚠️ Похоже, это не валидный email. Попробуйте еще раз:');
    }

    try {
      await this.userService.linkEmail(tgId, email);
      await ctx.reply(
        '✅ Регистрация успешно завершена!\n\n' +
          `Ваш аккаунт привязан к почте: *${email}*.\n` +
          'Теперь я смогу присылать вам личные задания.',
        { parse_mode: 'Markdown' },
      );
    } catch (error) {
      if (error.status === 409) {
        await ctx.reply('❌ Этот email уже используется другим пользователем.');
      } else {
        await ctx.reply('Произошла ошибка при сохранении.');
      }
    }
  }

  async sendTask(tgId: string, taskTitle: string, taskLink: string) {
    try {
      await this.bot.api.sendMessage(
        tgId,
        `🆕 *Новое задание:*\n\n${taskTitle}\n\n[Открыть задание](${taskLink})`,
        { parse_mode: 'Markdown' },
      );
    } catch (e) {
      if (e.description?.includes('blocked')) {
        await this.userService.markAsBlocked(tgId);
      }
    }
  }

  // В BotService.ts

async sendMessage(tgId: string, text: string) {
  try {
    await this.bot.api.sendMessage(tgId, text, {
      parse_mode: 'HTML', // Или 'MarkdownV2', HTML обычно удобнее для динамического текста
    });
    return { success: true };
  } catch (e) {
    this.logger.error(`Ошибка отправки сообщения пользователю ${tgId}: ${e.message}`);
    
    // Если пользователь заблокировал бота
    if (e.description?.includes('forbidden') || e.description?.includes('blocked')) {
      await this.userService.markAsBlocked(tgId);
      throw new Error('User blocked the bot');
    }
    throw e;
  }
}

}
