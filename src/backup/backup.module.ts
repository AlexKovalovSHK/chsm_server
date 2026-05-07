import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Путь к вашему PrismaModule

@Module({
  imports: [PrismaModule], // Импортируем Prisma, чтобы иметь доступ к базе
  providers: [BackupService],
  controllers: [BackupController],
  exports: [BackupService], // Экспортируем, если захотите использовать в других модулях
})
export class BackupModule {}