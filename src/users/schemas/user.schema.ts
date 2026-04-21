// src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true }) // Добавит createdAt и updatedAt автоматически
export class User extends Document {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  tel: string;

  @Prop()
  photoUrl: string; // Ссылка на аватарку из Google

  @Prop({ unique: true, sparse: true })
  email: string;

  @Prop({ unique: true, sparse: true })
  tgId: string;

  // Данные об обучении
  @Prop({ type: [String] })
  courses: string[];

  // Геймификация
  @Prop({ default: 0 })
  xp: number;

  @Prop({ default: 1 })
  level: number;

  @Prop({ type: Object })
  googleTokens: {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  };

  @Prop({ default: 'active' })
  status: string; // active, lead, archived

  @Prop({ type: [String], default: [] })
  lastSeenTaskIds: string[];

  @Prop({ default: 'student' })
  role: string; // 'student' | 'admin'
}

export const UserSchema = SchemaFactory.createForClass(User);
