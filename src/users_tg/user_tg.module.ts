// src/users_tg/user_tg.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserTgService } from './services/user_tg.service';
import { UserTgController } from './controllers/user_tg.controller';
import { UserTg, UserTgSchema } from './schemas/user_tg.schema';
import { TelegramModule } from '../telegram/telegram.module';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserTg.name, schema: UserTgSchema }]),
    forwardRef(() => TelegramModule), 
  ],
  providers: [UserTgService],
  exports: [UserTgService], 
  controllers: [UserTgController],
})
export class UserTgModule {}
