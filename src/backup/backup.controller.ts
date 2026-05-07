import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { BackupService } from './backup.service';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('manual-run')
  // Рекомендуется добавить Guard для проверки прав администратора!
  async manualRun() {
    return await this.backupService.runFullBackup();
  }

  @Get('status')
  async getStatus() {
    // Можно добавить логику проверки даты последнего успешного бэкапа
    return { status: 'Service is active', schedule: 'Every day at 3 AM' };
  }
}