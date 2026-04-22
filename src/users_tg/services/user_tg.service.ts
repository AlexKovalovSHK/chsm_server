import { Injectable, Logger, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserTg } from "../schemas/user_tg.schema";

@Injectable()
export class UserTgService {
  private readonly logger = new Logger(UserTgService.name);

  constructor(@InjectModel(UserTg.name) private userModel: Model<UserTg>) {}

  /**
   * 1. Найти всех пользователей (с фильтром по роли)
   * Используется в админ-панели
   */
  async findAll(role?: string): Promise<UserTg[]> {
    const filter = role ? { role } : {};
    // Сортируем по дате создания: новые сверху
    return this.userModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  /**
   * 2. Удалить пользователя по tgId
   * Используется в админ-панели
   */
  async remove(tgId: string): Promise<{ deleted: boolean }> {
    const result = await this.userModel.deleteOne({ tgId }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Пользователь с ID ${tgId} не найден`);
    }

    this.logger.log(`Пользователь ${tgId} удален из базы данных`);
    return { deleted: true };
  }

  /**
   * 3. Создать или обновить (Upsert)
   */
  async upsertUser(tgData: Partial<UserTg>): Promise<UserTg> {
    const { tgId, ...updateData } = tgData;
    return this.userModel.findOneAndUpdate(
      { tgId },
      { $set: updateData },
      { upsert: true, new: true }
    ).exec() as Promise<UserTg>;
  }

  /**
   * 4. Найти одного по ID
   */
  async findByInternalId(id: string) {
  return this.userModel.findById(id).exec(); // findById ищет по полю _id
}

  /**
   * 5. Обновить шаг регистрации
   */
  async updateRegistrationStep(tgId: string, step: string): Promise<void> {
    await this.userModel.updateOne({ tgId }, { $set: { registrationStep: step } });
  }

  /**
   * 6. Привязать Email (с проверкой на дубликаты)
   */
  async linkEmail(tgId: string, email: string): Promise<UserTg> {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await this.userModel.findOne({ 
      email: normalizedEmail, 
      tgId: { $ne: tgId } 
    }).exec();

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const updatedUser = await this.userModel.findOneAndUpdate(
      { tgId },
      { 
        $set: { 
          email: normalizedEmail, 
          registrationStep: 'completed',
          isVerified: true 
        } 
      },
      { new: true }
    ).exec();

    if (!updatedUser) {
      throw new NotFoundException(`User ${tgId} not found`);
    }

    return updatedUser;
  }

  /**
   * 7. Пометка блокировки бота
   */
  async markAsBlocked(tgId: string): Promise<void> {
    await this.userModel.updateOne({ tgId }, { $set: { status: 'blocked' } });
  }

  /**
   * 8. Получить список активных студентов для рассылки
   */
  async getActiveStudentsForMailing(): Promise<UserTg[]> {
    return this.userModel.find({
      status: 'active',
      isVerified: true
    }).exec();
  }
}