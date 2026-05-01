import { Injectable, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { UserService } from '../../users/application/user.service';
import { NewUserTgDto } from 'src/users/application/dto/new-user-tg.dto';

@Injectable()
export class TgInternalService {
  private readonly logger = new Logger(TgInternalService.name);

  constructor(private readonly userService: UserService) { } // Внедряем UserService

  // 1. Создание или обновление при входе в бот
  async upsertFromTelegram(data: {
    tgId: string;
    username?: string;
    firstName: string;
    lastName?: string;
    languageCode?: string;
  }) {
    // Используем существующий метод в UserService, 
    // но можно расширить его или использовать общий find/update
    return this.userService.upsertFromTelegram({
      id: Number(data.tgId),
      first_name: data.firstName,
      last_name: data.lastName,
    });
  }

  async syncUserData(dto: NewUserTgDto) {
    const { tgId, ...updateData } = dto;

    let user = await this.userService.findByTgId(tgId);

    if (!user) {
      // Если пользователя нет, создаем новую запись с начальными данными
      user = await this.userService.create({
        tgId,
        username: updateData.username,
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        registrationStep: updateData.registrationStep || 'new',
        status: 'pending'
      });
    } else {
      // Если пользователь есть, просто обновляем пришедшие поля
      user = await this.userService.update(user.id.toString(), updateData);
    }

    return user;
  }

  // 2. Обновление шага регистрации
  async updateRegistrationStep(tgId: string, step: string) {
    const user = await this.userService.findByTgId(tgId);
    if (!user) throw new NotFoundException('User not found');

    return this.userService.update(user.id.toString(), {
      registrationStep: step
    });
  }

  // 3. Привязка Email через бота
  async linkEmail(tgId: string, email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // Проверка дубликата через UserService
    const users = await this.userService.findAll({ search: normalizedEmail });
    const isEmailBusy = users.some(u => u.email === normalizedEmail && u.tgId !== tgId);

    if (isEmailBusy) {
      throw new ConflictException('Email already in use');
    }

    const user = await this.userService.findByTgId(tgId);
    if (!user) throw new NotFoundException('User not found');

    return this.userService.update(user.id.toString(), {
      email: normalizedEmail,
      isVerified: true,
      registrationStep: 'completed',
      status: 'active',
    });
  }

  // 4. Блокировка
  async markAsBlocked(tgId: string) {
    const user = await this.userService.findByTgId(tgId);
    if (user) {
      return this.userService.update(user.id.toString(), { status: 'blocked' });
    }
  }
}