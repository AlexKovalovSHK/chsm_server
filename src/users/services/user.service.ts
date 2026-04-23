import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  // 1. Поиск всех (для Админки на React)
  async findAll(filters: { search?: string; status?: string }) {
    const query: any = {};

    // Если есть поиск, ищем по имени, фамилии или почте (регистронезависимо)
    if (filters.search) {
      query.$or = [
        { firstName: new RegExp(filters.search, 'i') },
        { lastName: new RegExp(filters.search, 'i') },
        { email: new RegExp(filters.search, 'i') },
      ];
    }

    // Фильтр по статусу (например, 'active' или 'archived')
    if (filters.status) {
      query.status = filters.status;
    } else {
      // По умолчанию не показываем удаленных в общем списке
      query.status = { $ne: 'archived' };
    }

    return this.userModel.find(query).sort({ createdAt: -1 }).exec();
  }

  // 2. Поиск по системному ID (_id)
  async findById(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  // 3. Поиск по TG ID (для бота)
  async findByTgId(tgId: string) {
    return this.userModel.findOne({ tgId }).exec();
  }

  // 4. Обновление данных
 async update(id: string, updateData: Partial<User>) {
  const updatedUser = await this.userModel
    .findByIdAndUpdate(id, { $set: updateData }, { returnDocument: 'after' })
    .exec();
  if (!updatedUser) throw new NotFoundException('Пользователь не найден');
  return updatedUser;
}

  // 5. Мягкое удаление (Soft Delete)
  async softDelete(id: string) {
    return this.update(id, { status: 'archived' } as any);
  }

  // src/users/services/user.service.ts

  async findAdmin() {
    const admin = await this.userModel
      .findOne({
        role: 'admin',
        googleTokens: { $exists: true },
      })
      .exec();

    if (!admin) {
      throw new NotFoundException(
        'Администратор не найден. Пожалуйста, назначьте роль admin и привяжите Google аккаунт.',
      );
    }
    return admin;
  }

  // --- Функционал для Бота и Авторизации ---

  async upsertFromTelegram(tgUser: {
    id: number;
    first_name: string;
    last_name?: string;
  }) {
    return this.userModel.findOneAndUpdate(
      { tgId: tgUser.id.toString() },
      {
        $set: {
          firstName: tgUser.first_name,
          lastName: tgUser.last_name || '',
          status: 'active',
        },
      },
      { upsert: true, new: true },
    );
  }

  // src/users/services/user.service.ts

  async saveGoogleTokens(
    tgId: string,
    email: string,
    tokens: any,
    profile?: any,
  ) {
    this.logger.log(`Сохранение токенов для TG_ID: ${tgId}, Email: ${email}`);

    const result = await this.userModel
      .findOneAndUpdate(
        { tgId: tgId }, // Поиск
        {
          $set: {
            email: email,
            googleTokens: tokens,
            photoUrl: profile?.picture,
            firstName: profile?.given_name,
            lastName: profile?.family_name,
            status: 'active', // Убеждаемся, что статус активен
          },
        },
        {
          upsert: true, // СОЗДАТЬ, ЕСЛИ НЕТ
          new: true, // Вернуть обновленный документ
        },
      )
      .exec();

    this.logger.log(`Результат сохранения: ${result ? 'УСПЕХ' : 'ОШИБКА'}`);
    return result;
  }

  async addXp(tgId: string, amount: number) {
    const user = await this.userModel.findOne({ tgId });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const newXp = (user.xp || 0) + amount;
    const newLevel = Math.floor(newXp / 100) + 1;
    const isLevelUp = newLevel > (user.level || 1);

    await this.userModel.updateOne(
      { tgId },
      { $set: { xp: newXp, level: newLevel } },
    );

    return { newXp, newLevel, isLevelUp };
  }

  async findAllForSync() {
    return this.userModel
      .find({
        googleTokens: { $exists: true },
        status: 'active',
      })
      .exec();
  }
}
