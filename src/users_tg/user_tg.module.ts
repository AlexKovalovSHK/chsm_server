// src/users_tg/user_tg.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserTgService } from './services/user_tg.service';
import { UserTgController } from './controllers/user_tg.controller';
import { UserTg, UserTgSchema } from './schemas/user_tg.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserTg.name, schema: UserTgSchema }]),
  ],
  controllers: [UserTgController],
  providers: [UserTgService],
  exports: [UserTgService],
})
export class UserTgModule {}
