import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Ваши модули
import { ClassroomModule } from './classroom/classrom.module';
import { UsersModule } from './users/users.module';
import { TelegramModule } from './telegram/telegram.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    // 1. Подключение к MongoDB (Bun + NestJS)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        dbName: configService.get<string>('MONGODB_NAME'),
      }),
      inject: [ConfigService],
    }),

    // 2. Включение поддержки @Cron()
    ScheduleModule.forRoot(),

    // 3. Ваши функциональные модули
    TelegramModule, // Здесь создается инстанс бота
    ClassroomModule,
    UsersModule,
    SyncModule, // Здесь живет SyncService, который всех объединяет
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
