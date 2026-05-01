import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'users' })
export class UserDocument extends Document {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  username: string;

  @Prop()
  tel: string;

  @Prop()
  photoUrl: string;

  @Prop({ unique: true, sparse: true })
  email: string;

  @Prop({ unique: true, sparse: true })
  tgId: string;

  @Prop()
  googleId: string;

  @Prop({ default: 'student' })
  role: string;

  @Prop({ default: 'active' })
  status: string;

  @Prop({ type: [String], default: [] })
  courses: string[];

  @Prop({ type: [String], default: [] })
  lastSeenTaskIds: string[];

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

  @Prop()
  _sourceUser: string;

  @Prop()
  _sourceTg: string;

  @Prop()
  _mergedAt: Date;

  @Prop()
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);
