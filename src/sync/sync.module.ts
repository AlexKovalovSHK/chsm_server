// src/sync/sync.module.ts
import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { UsersModule } from '../users/users.module';
import { ClassroomModule } from '../classroom/classrom.module';

@Module({
  imports: [UsersModule, ClassroomModule], // Импортируем другие модули, чтобы видеть их сервисы
  providers: [SyncService],
})
export class SyncModule {}