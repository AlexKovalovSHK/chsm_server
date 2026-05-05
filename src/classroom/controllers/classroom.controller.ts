import { Controller, Get, Query, Res, Inject, Post, forwardRef, Body } from '@nestjs/common';
import express from 'express';
import { ClassroomService } from '../service/classroom.service';
import { UserService } from '../../users/application/user.service'; // Путь к вашему сервису пользователей
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Classroom')
@Controller('auth')
export class ClassroomController {
  constructor(
    @Inject(forwardRef(() => ClassroomService))
    private readonly classroomService: ClassroomService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService, // ПРАВИЛЬНЫЙ ИНЖЕКТ
  ) { }

  // 1. Ссылка на вход теперь должна принимать tgId
  // Пример: http://localhost:5001/auth/login?tgId=12345678
  @ApiOperation({ summary: 'Редирект на Google login по tgId' })
  @ApiQuery({ name: 'tgId', required: true })
  @Get('login')
  login(@Query('tgId') tgId: string, @Res() res: express.Response) {
    if (!tgId) {
      return res.status(400).send('Ошибка: tgId обязателен (передается ботом)');
    }
    // Передаем tgId в Google, чтобы он вернул его нам в callback (через параметр state)
    const url = this.classroomService.getAuthUrl(tgId);
    return res.redirect(url);
  }

  @ApiOperation({ summary: 'Редирект на Google login по email' })
  @ApiQuery({ name: 'email', required: true })
  @Get('login-email')
  loginEmail(@Query('email') email: string, @Res() res: express.Response) {
    if (!email) {
      return res.status(400).send('Ошибка: email обязателен');
    }
    // Передаем tgId в Google, чтобы он вернул его нам в callback (через параметр state)
    const url = this.classroomService.getAuthUrlByEmail(email);
    return res.redirect(url);
  }

  // 2. Обработка возврата от Google
  @ApiOperation({ summary: 'Callback от Google OAuth' })
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'state', required: true })
  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string) {
    try {
      const tokens = await this.classroomService.getTokensFromCode(code);
      const profile = await this.classroomService.getGoogleProfile(tokens);

      const adminEmail = process.env.ADMIN_SYSTEM_EMAIL || '';
      // Если это наш админский email, сохраняем как системный токен
      if (profile.email === adminEmail) {
        await this.classroomService.saveAdminTokens(profile.email, tokens);
      }

      // Опционально: все равно сохраняем данные в профиль пользователя
      await this.userService.saveGoogleTokens(state, profile.email || '', tokens, profile);

      return `<h1>✅ Система настроена!</h1><p>Админский доступ ${profile.email} активен.</p>`;
    } catch (error) {
      console.error(error);
      return 'Ошибка авторизации';
    }
  }

  // 3. Отчет по ID курса (теперь берем токены из базы, а не из Query)
  @ApiOperation({ summary: 'Получить отчет по курсу' })
  @ApiQuery({ name: 'tgId', required: true })
  @ApiQuery({ name: 'courseId', required: true })
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

  @ApiOperation({ summary: 'Получить курсы Google Classroom' })
  @Get('courses')
  async getCourses() {
    try {
      const adminTokens = await this.classroomService.getAdminTokens();
      return this.classroomService.getCourses(adminTokens);
    } catch (error: any) {
      return { error: error.message };
    }
  }

  @ApiOperation({ summary: 'Форсировать синхронизацию (deprecated)' })
  @Post('sync')
  async forceSync() {
    return { message: 'Синхронизация курсов больше не требуется, данные берутся напрямую из Google Classroom.' };
  }

  @ApiOperation({ summary: 'Опубликовать объявление о боте' })
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

  // 1. Получить полный отчет по всей школе (Live Data из Google)
  @ApiOperation({ summary: 'Получить live-отчет школы' })
  @Get('admin/live-report')
  async getLiveReport() {
    try {
      // Платформа сама берет системный токен админа
      const adminTokens = await this.classroomService.getAdminTokens();

      // Запрашиваем данные напрямую из Google
      const report = await this.classroomService.getLiveFullState(adminTokens);

      return report;
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // 2. Синхронизировать все курсы в базу данных (Отключено)
  @ApiOperation({ summary: 'Синхронизация курсов (deprecated)' })
  @Post('admin/sync-courses')
  async syncAll() {
    return { message: 'Синхронизация курсов больше не требуется, данные берутся напрямую из Google Classroom.' };
  }

  // 3. Отправить объявление во все курсы сразу
  @ApiOperation({ summary: 'Отправить объявление во все курсы' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['text'],
      properties: { text: { type: 'string' } },
    },
  })
  @Post('admin/announce-all')
  async announceAll(@Body('text') text: string) {
    try {
      const adminTokens = await this.classroomService.getAdminTokens();
      return await this.classroomService.postAnnouncementToAll(adminTokens, text);
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // рассылка на gmail
  @ApiOperation({ summary: 'Рассылка email' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['users', 'text'],
      properties: {
        users: { type: 'array', items: { type: 'string' } },
        subject: { type: 'string' },
        text: { type: 'string' },
      },
    },
  })
  @Post('broadcast-email')
  async broadcastEmail(
    @Body() dto: { users: string[]; subject?: string; text: string }
  ) {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as { email: string; error: string }[],
    };

    // Заголовок письма по умолчанию, если не передан
    const subject = dto.subject || 'Уведомление от Classroom Bot';

    for (const email of dto.users) {
      const cleanEmail = email.toLowerCase().trim();

      try {
        // Вызываем метод сервиса
        await this.classroomService.sendEmail(
          cleanEmail,
          subject,
          dto.text
        );

        results.sent++;
      } catch (e: any) {
        results.failed++;
        results.errors.push({
          email: cleanEmail,
          error: e.message
        });
      }
    }

    return { success: true, results };
  }

}
