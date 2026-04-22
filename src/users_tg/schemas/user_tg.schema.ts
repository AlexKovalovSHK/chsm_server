import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ 
  timestamps: true, // Автоматически создаст поля createdAt и updatedAt
  collection: 'users_tg' 
})
export class UserTg extends Document {
  
  @Prop({ required: true, unique: true, index: true })
  tgId: string; // Технический ID Telegram. String — безопаснее для очень длинных чисел.

  @Prop()
  username: string; // Никнейм без @ (может быть null)

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ unique: true, sparse: true, index: true })
  email: string; // Email с вашей платформы. sparse: true позволяет иметь много записей с null.

  @Prop()
  tel: string; // Получим, если пользователь нажмет "Поделиться контактом"

  @Prop()
  photoUrl: string; // Ссылка на фото (учтите, что в TG они временные)

  @Prop()
  languageCode: string; // Код языка (ru, en), пригодится для локализации заданий

  @Prop({ default: 'student' })
  role: string; // 'student' | 'admin' | 'teacher'

  @Prop({ 
    type: String, 
    enum: ['active', 'blocked', 'kicked'], 
    default: 'active' 
  })
  status: string; 
  // 'active' — бот может писать
  // 'blocked' — пользователь заблокировал бота (ловим ошибку 403)
  // 'kicked' — если пользователь удалился из группы (если нужно)

  @Prop({ default: 'new' })
  registrationStep: string; 

  @Prop({ type: Boolean, default: false })
  isVerified: boolean; // Подтвержден ли Email (например, кодом из письма)

  @Prop({ type: Boolean, default: false })
  isPremium: boolean; // Есть ли у пользователя TG Premium (для статистики)

  @Prop({ type: String })
  platformId: string; // Внешний ID студента из основной базы вашей платформы (если есть)

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>; 
}

export const UserTgSchema = SchemaFactory.createForClass(UserTg);

// Индексы для ускорения рассылок и поиска
UserTgSchema.index({ status: 1, role: 1 });