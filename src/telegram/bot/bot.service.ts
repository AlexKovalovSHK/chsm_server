import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { Bot, Context } from 'grammy';
import { UserTgService } from 'src/users_tg/services/user_tg.service';

@Injectable()
export class BotService implements OnModuleInit {
  private readonly logger = new Logger(BotService.name);

  constructor(
    @Inject('TELEGRAM_BOT') private readonly bot: Bot,
    private readonly userService: UserTgService,
  ) {}

  onModuleInit() {
    this.logger.log('🤖 Инициализация бота для регистрации...');

    // 1. Сохраняем/обновляем базовые данные пользователя при каждом контакте
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

    // 2. Команда /start - Начало регистрации
    this.bot.command('start', async (ctx) => {
      const tgId = ctx.from!.id.toString();
      const user = await this.userService.findByInternalId(tgId);

      if (user?.isVerified) {
        return ctx.reply(`Вы уже зарегистрированы как ${user.email}. Ожидайте новых заданий!`);
      }

      // Переводим пользователя в состояние ожидания email
      await this.userService.updateRegistrationStep(tgId, 'waiting_email');

      await ctx.reply(
        `Привет, ${ctx.from?.first_name}! 👋\n\n` +
        'Я буду присылать тебе задания из учебной платформы прямо сюда.\n' +
        'Для начала регистрации, пожалуйста, **введи свой Email:**',
        { parse_mode: 'Markdown' }
      );
    });

    // 3. Обработка текстовых сообщений (ввод Email)
    this.bot.on('message:text', async (ctx) => {
      const tgId = ctx.from.id.toString();
      const text = ctx.message.text.trim();
      
      // Получаем текущее состояние пользователя из БД
      const user = await this.userService.findByInternalId(tgId);

      if (user?.registrationStep === 'waiting_email') {
        await this.handleEmailInput(ctx, tgId, text);
      } else {
        // Если пользователь просто что-то пишет вне процесса регистрации
        await ctx.reply('Используйте меню или команду /start для начала работы.');
      }
    });

    this.bot.start();
    this.logger.log('🤖 Бот запущен и готов собирать Email-ы');
  }

  /**
   * Логика обработки и валидации Email
   */
  private async handleEmailInput(ctx: any, tgId: string, email: string) {
    // Простая проверка email регулярным выражением
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return ctx.reply('⚠️ Похоже, это не валидный email. Попробуйте еще раз:');
    }

    try {
      // Пытаемся привязать email через наш сервис
      await this.userService.linkEmail(tgId, email);
      
      await ctx.reply(
        '✅ Регистрация успешно завершена!\n\n' +
        `Ваш аккаунт привязан к почте: *${email}*.\n` +
        'Теперь я смогу присылать вам личные задания.',
        { parse_mode: 'Markdown' }
      );

      this.logger.log(`Студент зарегистрирован: ${email} (tgId: ${tgId})`);

    } catch (error) {
      if (error.status === 409) { // ConflictException из сервиса
        await ctx.reply('❌ Этот email уже используется другим пользователем. Введите другой email:');
      } else {
        this.logger.error(`Ошибка при регистрации: ${error.message}`);
        await ctx.reply('Произошла ошибка при сохранении. Пожалуйста, попробуйте позже.');
      }
    }
  }

  /**
   * Метод для отправки заданий (можно вызывать из контроллеров платформы)
   */
  async sendTask(tgId: string, taskTitle: string, taskLink: string) {
    try {
      await this.bot.api.sendMessage(
        tgId, 
        `🆕 *Новое задание:*\n\n${taskTitle}\n\n[Открыть задание](${taskLink})`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      if (e.description?.includes('blocked')) {
        await this.userService.markAsBlocked(tgId);
      }
    }
  }
}