import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'system_google_auth' })
export class GoogleAuth extends Document {
  @Prop({ required: true, unique: true })
  email: string; // Почта администратора школы

  @Prop({ type: Object, required: true })
  tokens: {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
    scope: string;
    token_type: string;
  };

  @Prop({ default: true })
  isActive: boolean;
}

export const GoogleAuthSchema = SchemaFactory.createForClass(GoogleAuth);