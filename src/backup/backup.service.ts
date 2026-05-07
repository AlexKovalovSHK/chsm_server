import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { $ } from 'bun';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  private readonly SOURCE_DB = process.env.DATABASE_URL;
  private readonly TARGET_DB = process.env.DATABASE_BACKUP_URL;
  private readonly BACKUP_DIR = join(process.cwd(), 'backups_history');

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM) // Запуск в 3 часа ночи
  async handleCron() {
    this.logger.log('⏰ Запуск запланированного бэкапа по расписанию...');
    await this.runFullBackup();
  }

  async runFullBackup() {
    try {
      // 1. Sanity Check
      const usersCount = await this.prisma.user.count();
      if (usersCount < 5) {
        throw new Error(`Sanity Check провален: найдено всего ${usersCount} юзеров.`);
      }

      // 2. Создание папки
      if (!existsSync(this.BACKUP_DIR)) {
        await mkdir(this.BACKUP_DIR, { recursive: true });
      }

      // 3. Зеркалирование (Neon -> Резервная база)
      this.logger.log('🔄 Обновление зеркала БД...');
      await $`pg_dump --clean --if-exists ${this.SOURCE_DB} | psql ${this.TARGET_DB}`;

      // 4. Версионирование (Создание файла .sql.gz)
      const date = new Date().toISOString().split('T')[0];
      const fileName = join(this.BACKUP_DIR, `backup_${date}.sql.gz`);
      this.logger.log(`📦 Создание архива: ${fileName}`);
      await $`pg_dump ${this.SOURCE_DB} | gzip > ${fileName}`;

      // 5. Очистка старых (старше 14 дней)
      await $`find ${this.BACKUP_DIR} -type f -name "*.sql.gz" -mtime +14 -delete`;

      this.logger.log('✅ Весь процесс бэкапа завершен успешно!');
      return { success: true, file: fileName };
    } catch (error) {
      this.logger.error(`❌ Ошибка бэкапа: ${error.message}`);
      throw error;
    }
  }
}