import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
// @ts-ignore
const { $ } = Bun;
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class BackupService implements OnModuleInit {
    private readonly logger = new Logger(BackupService.name);

    private readonly SOURCE_DB = process.env.DATABASE_URL;
    private readonly TARGET_DB = process.env.DATABASE_BACKUP_URL;
    private readonly BACKUP_DIR = join(process.cwd(), 'backups_history');

    constructor(private prisma: PrismaService) {
        this.logger.log('🏗️ BackupService constructor called');
        this.logger.log(`SOURCE_DB: ${this.SOURCE_DB ? '✅' : '❌'}`);
        this.logger.log(`TARGET_DB: ${this.TARGET_DB ? '✅' : '❌'}`);
    }

    async onModuleInit() {
        this.logger.log('✅ BackupService onModuleInit - сервис инициализирован!');
        this.logger.log(`DEV режим: ${process.env.DEV === 'true' ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}`);
        
        // Тестовый запуск через 5 секунд
        this.logger.log('⏰ Запланирован тестовый запуск через 5 секунд...');
        setTimeout(async () => {
            this.logger.log('🧪 Запуск тестового бэкапа...');
            try {
                await this.runFullBackup();
            } catch (error) {
                this.logger.error(`Тестовый бэкап failed: ${error.message}`);
            }
        }, 5000);
    }

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async handleCron() {
        this.logger.log('⏰ Запуск запланированного бэкапа по расписанию...');
        await this.runFullBackup();
    }

    async runFullBackup() {
        const isDev = process.env.DEV === 'true';
        this.logger.log(`runFullBackup() вызван, isDev=${isDev}`);
        
        if (isDev) {
            this.logger.warn('⚠️ DEV режим: пропускаем бэкап');
            return { success: false, reason: 'DEV mode' };
        }
        
        try {
            this.logger.log('🚀 Начинаем процесс бэкапа...');
            
            // 1. Sanity Check
            this.logger.log('Проверка количества пользователей...');
            const usersCount = await this.prisma.user.count();
            this.logger.log(`Найдено пользователей: ${usersCount}`);
            
            if (usersCount < 5) {
                throw new Error(`Sanity Check провален: найдено всего ${usersCount} юзеров.`);
            }

            // 2. Создание папки
            if (!existsSync(this.BACKUP_DIR)) {
                await mkdir(this.BACKUP_DIR, { recursive: true });
                this.logger.log(`Создана директория: ${this.BACKUP_DIR}`);
            }

            // 3. Зеркалирование
            this.logger.log('🔄 Обновление зеркала БД...');
            await $`pg_dump --clean --if-exists ${this.SOURCE_DB} | psql ${this.TARGET_DB}`;
            this.logger.log('Зеркалирование завершено');

            // 4. Версионирование
            const date = new Date().toISOString().split('T')[0];
            const fileName = join(this.BACKUP_DIR, `backup_${date}.sql.gz`);
            this.logger.log(`📦 Создание архива: ${fileName}`);
            await $`pg_dump ${this.SOURCE_DB} | gzip > ${fileName}`;
            this.logger.log('Архив создан');

            // 5. Очистка старых
            await $`find ${this.BACKUP_DIR} -type f -name "*.sql.gz" -mtime +14 -delete`;
            this.logger.log('Очистка старых бэкапов завершена');

            this.logger.log('✅ Весь процесс бэкапа завершен успешно!');
            return { success: true, file: fileName };
            
        } catch (error) {
            this.logger.error(`❌ Ошибка бэкапа: ${error.message}`);
            throw error;
        }
    }
}