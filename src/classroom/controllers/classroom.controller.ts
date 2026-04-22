import { Controller, Get, Query, Res, Inject, Post, forwardRef } from '@nestjs/common';
import express from 'express';
import { ClassroomService } from '../service/classroom.service';
import { UserService } from '../../users/services/user.service'; // Путь к вашему сервису пользователей

@Controller('auth')
export class ClassroomController {
  constructor(
    @Inject(forwardRef(() => ClassroomService))
    private readonly classroomService: ClassroomService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService, // ПРАВИЛЬНЫЙ ИНЖЕКТ
  ) {}

  // 1. Ссылка на вход теперь должна принимать tgId
  // Пример: http://localhost:5001/auth/login?tgId=12345678
  @Get('login')
  login(@Query('tgId') tgId: string, @Res() res: express.Response) {
    if (!tgId) {
      return res.status(400).send('Ошибка: tgId обязателен (передается ботом)');
    }
    // Передаем tgId в Google, чтобы он вернул его нам в callback (через параметр state)
    const url = this.classroomService.getAuthUrl(tgId);
    return res.redirect(url);
  }

  // 2. Обработка возврата от Google
  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') tgId: string) {
    if (!code || !tgId) {
      return 'Ошибка: не хватает данных от Google или Telegram ID.';
    }

    try {
      const tokens = await this.classroomService.getTokensFromCode(code);
      const profile = await this.classroomService.getGoogleProfile(tokens);

      // ИСПРАВЛЕНИЕ ТУТ:
      // Проверяем, что email существует. После этой проверки TS поймет, что это string.
      if (!profile.email) {
        throw new Error('Google did not return an email');
      }

      // Теперь TS не ругается, так как мы проверили profile.email и tgId на существование
      await this.userService.saveGoogleTokens(
        tgId,
        profile.email,
        tokens,
        profile,
      );

      return `<h1>✅ Успешно!</h1><p>Аккаунт ${profile.email} привязан.</p>`;
    } catch (error) {
      console.error('Ошибка в callback:', error);
      return 'Произошла ошибка при авторизации.';
    }
  }

  // 3. Отчет по ID курса (теперь берем токены из базы, а не из Query)
  @Get('full-report')
  async getReport(
    @Query('tgId') tgId: string,
    @Query('courseId') courseId: string,
  ) {
    const user = await this.userService.findByTgId(tgId);
    if (!user || !user.googleTokens)
      return 'Пользователь не авторизован в Google';

    const report = await this.classroomService.getFullGradebook(
      user.googleTokens,
      courseId,
    );
    return report;
  }

  @Get('courses')
  async getCourses() {
    // Просто возвращаем всё, что сохранили в базу
    return this.classroomService.getCourses({ isActive: true });
  }

  @Post('sync')
  async forceSync() {
    const admin = await this.userService.findAdmin();
    return this.classroomService.syncCoursesToDb(admin.googleTokens);
  }

  @Post('announce-bot')
  async announceBot() {
    const admin = await this.userService.findAdmin();

    const botLink = 'https://t.me/chsm_brass_bot';
    const message = `🎵 Привет! Подключай нашего школьного бота, чтобы следить за учебным процессом: ${botLink}`;

    return this.classroomService.postAnnouncementToAll(
      admin.googleTokens,
      message,
    );
  }
}
