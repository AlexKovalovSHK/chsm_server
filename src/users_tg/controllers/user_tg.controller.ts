import { Controller, Get, Post, Body, Param, Delete, Patch, Query } from "@nestjs/common";
import { UserTgService } from "../services/user_tg.service";
import { BotService } from "src/telegram/bot/bot.service";

@Controller('admin/tg-users') // Лучше добавить префикс admin для ясности
export class UserTgController {
  constructor(
    private readonly userTgService: UserTgService,
    private readonly botService: BotService, // Для выполнения рассылок
  ) {}

  // 1. Получить всех пользователей (с простейшей фильтрацией)
  @Get()
  async getAllUsers(@Query('role') role?: string) {
    // Здесь можно вызвать метод findAll из сервиса
    return this.userTgService.findAll(role);
  }

  // 2. Получить одного пользователя по tgId
  @Get(':tgId')
  async getUser(@Param('tgId') tgId: string) {
    return this.userTgService.findByInternalId(tgId);
  }

  // 4. МАССОВАЯ РАССЫЛКА объявлений через API
  @Post('broadcast')
  async broadcastMessage(@Body('text') text: string) {
    const users = await this.userTgService.getActiveStudentsForMailing();
    
    let successCount = 0;
    for (const user of users) {
      try {
        // Вызываем метод бота для отправки сообщения
        await this.botService.sendTask(user.tgId, "📢 ОБЪЯВЛЕНИЕ", text);
        successCount++;
        // Небольшая задержка, чтобы не спамить в API Telegram
        await new Promise(res => setTimeout(res, 50)); 
      } catch (e) {
        console.error(`Ошибка при рассылке для ${user.tgId}`);
      }
    }
    
    return { message: 'Рассылка завершена', sentTo: successCount };
  }

  // 5. Удалить пользователя (или заархивировать)
  @Delete(':tgId')
  async removeUser(@Param('tgId') tgId: string) {
    // Метод в сервисе для удаления
    return this.userTgService.remove(tgId);
  }
}