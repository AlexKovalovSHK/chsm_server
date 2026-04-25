import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserTgService } from '../services/user_tg.service';
import { BotService } from '../../telegram/bot/bot.service';

@Controller('admin/tg-users') // Лучше добавить префикс admin для ясности
export class UserTgController {
  constructor(
    private readonly userTgService: UserTgService,
    private readonly botService: BotService, // Для выполнения рассылок
  ) {}

  // 1. Получить всех пользователей (с простейшей фильтрацией)
  /*@Get()
  async getAllUsers(@Query('role') role?: string) {
    // Здесь можно вызвать метод findAll из сервиса
    return this.userTgService.findAll(role);
  }*/

  @Get()
async getAllUsers(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 10,
  @Query('search') search?: string,
  @Query('step') step?: string,
) {
  // Вызываем сервис с параметрами пагинации
  return this.userTgService.findAllPaginated({
    page: Number(page),
    limit: Number(limit),
    search,
    step,
  });
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
        await this.botService.sendTask(user.tgId, '📢 ОБЪЯВЛЕНИЕ', text);
        successCount++;
        // Небольшая задержка, чтобы не спамить в API Telegram
        await new Promise((res) => setTimeout(res, 50));
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

  @Post(':tgId/send-message')
  async sendMessageToUser(
    @Param('tgId') tgId: string,
    @Body('message') message: string,
  ) {
    if (!message || message.trim().length === 0) {
      throw new Error('Сообщение не может быть пустым');
    }

    // 1. Проверяем, существует ли пользователь в базе
    const user = await this.userTgService.findByTgId(tgId);
    if (!user) {
      throw new NotFoundException(`Пользователь с TG ID ${tgId} не найден`);
    }

    try {
      // 2. Отправляем через BotService
      await this.botService.sendMessage(tgId, message);
      return {
        status: 'success',
        message: `Сообщение успешно отправлено пользователю ${tgId}`,
      };
    } catch (error) {
      if (error.message === 'User blocked the bot') {
        throw new InternalServerErrorException(
          'Пользователь заблокировал бота',
        );
      }
      throw new InternalServerErrorException('Не удалось отправить сообщение');
    }
  }
}
