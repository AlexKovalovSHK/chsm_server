// src/sync/sync.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { UsersModule } from '../users/users.module';
import { ClassroomModule } from '../classroom/classrom.module';

@Module({
  imports: [forwardRef(() => UsersModule), forwardRef(() => ClassroomModule)],
  providers: [SyncService],
})
export class SyncModule {}
