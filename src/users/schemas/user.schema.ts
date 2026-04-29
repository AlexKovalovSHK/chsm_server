// src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  // ── Профиль ──────────────────────────────────────────────
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  username: string; // ник из Telegram (без @)

  @Prop()
  tel: string;

  @Prop()
  photoUrl: string;

  // ── Идентификаторы ────────────────────────────────────────
  @Prop({ unique: true, sparse: true })
  email: string;

  @Prop({ unique: true, sparse: true })
  tgId: string;

  // ── Роль / статус ─────────────────────────────────────────
  @Prop({ default: 'student' })
  role: string; // 'student' | 'admin' | 'teacher'

  @Prop({ default: 'active' })
  status: string; // 'active' | 'blocked' | 'kicked' | 'lead' | 'archived'

  // ── Обучение ──────────────────────────────────────────────
  @Prop({ type: [String], default: [] })
  courses: string[];

  @Prop({ type: [String], default: [] })
  lastSeenTaskIds: string[];

  // ── Геймификация ──────────────────────────────────────────
  @Prop({ default: 0 })
  xp: number;

  @Prop({ default: 1 })
  level: number;

  // ── Google ────────────────────────────────────────────────
  @Prop({ type: Object })
  googleTokens: {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  };

  // ── Telegram-специфичные ──────────────────────────────────
  @Prop()
  languageCode: string;

  @Prop({ default: 'new' })
  registrationStep: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  isPremium: boolean;

  @Prop()
  platformId: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;

  // ── Аудит миграции ────────────────────────────────────────
  @Prop()
  _sourceUser: string; // ObjectId из старой коллекции users_old

  @Prop()
  _sourceTg: string;   // ObjectId из старой коллекции users_tg

  @Prop()
  _mergedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);