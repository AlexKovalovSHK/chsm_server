// src/telegram/telegram.module.ts
import { Module, Global } from '@nestjs/common';
import { Bot } from 'grammy';
import { BotService } from './bot/bot.service';
import { UserTgModule } from 'src/users_tg/user_tg.module';

@Global()
@Module({
  imports: [UserTgModule],
  providers: [
    {
      provide: 'TELEGRAM_BOT',
      useFactory: () => {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) throw new Error('TELEGRAM_BOT_TOKEN not found');
        return new Bot(token);
      },
    },
    BotService,
  ],
  exports: ['TELEGRAM_BOT', BotService],
})
export class TelegramModule {}