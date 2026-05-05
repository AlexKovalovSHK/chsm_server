import { Module } from '@nestjs/common';

import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClassroomModule } from './classroom/classrom.module';
import { UsersModule } from './users/users.module';
import { TelegramModule } from './telegram/tg.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,

    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    TelegramModule,
    ClassroomModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
