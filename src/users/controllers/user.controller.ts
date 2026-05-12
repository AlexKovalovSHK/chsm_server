import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  UseGuards,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '../application/user.service';
import { UpdateUserDto } from '../application/dto/update-user.dto';
import { NewUserDto } from '../application/dto/new-user.dto';
import { ChangePasswordDto } from '../application/dto/change-password.dto';
import { UserMapper } from '../infrastructure/user.mapper';
import { ClassroomService } from '../../classroom/service/classroom.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/decorators/current-user.decorator';
import express from 'express';
import { Public } from 'src/auth/decorators/public.decorator';
import * as jwtPayloadInterface from 'src/auth/interfaces/jwt-payload.interface';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';
import { BotApiService } from '../../telegram/service/bot-api.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly userService: UserService,
    private readonly classroomService: ClassroomService,
    private readonly botApiService: BotApiService,
  ) {}

  onModuleInit() {
    if (!process.env.GOOGLE_CLIENT_ID) {
      this.logger.error('❌ GOOGLE_CLIENT_ID не найден в .env');
    } else {
      this.logger.log('✅ Google API настроен корректно');
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Получить текущего пользователя из JWT' })
  getMe(@CurrentUser() user: JwtPayload) {
    return user;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Получить список пользователей' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'role', required: false })
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
  ) {
    const users = await this.userService.findAll({ search, status, role });
    return users.map((user) => UserMapper.toResponseDto(user));
  }

  @Get('link-url')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Получить URL для привязки Google по email' })
  @ApiQuery({ name: 'email', required: true })
  async getLinkUrl(@Query('email') email: string) {
    // Формируем state вручную и передаем ОДНИМ аргументом
    const state = `web:${email}`;
    const url = this.classroomService.getAuthUrl(state); // Теперь ошибок нет
    return { url };
  }

  @Public()
  @Get('link')
  @ApiOperation({ summary: 'Редирект на Google OAuth по tgId/email' })
  @ApiQuery({ name: 'tgId', required: false })
  @ApiQuery({ name: 'email', required: false })
  async link(
    @Res() res: express.Response,
    @Query('tgId') tgId?: string,
    @Query('email') email?: string,
  ) {
    let state = '';
    if (tgId) {
      state = `tg:${tgId}`;
    } else if (email) {
      state = `web:${email}`;
    } else {
      throw new BadRequestException('Необходим tgId или email');
    }

    // Передаем сформированную строку state
    const url = this.classroomService.getAuthUrl(state);
    return res.redirect(url);
  }

  @Get('auth-link')
  @ApiOperation({ summary: 'Получить auth ссылку по tgId' })
  @ApiQuery({ name: 'tgId', required: true })
  async getAuthLink(@Query('tgId') tgId: string) {
    if (!tgId) throw new BadRequestException('tgId is required');

    const state = `tg:${tgId}`;
    const url = this.classroomService.getAuthUrl(state);

    return { url };
  }

  // В UserController
  @Patch('sync')
  @ApiOperation({ summary: 'Синхронизировать пользователя из Telegram' })
  async sync(@Body() data: any) {
    return this.userService.syncTelegramUser(data);
  }

  @Get('admins/stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Получить статистику курса для администратора' })
  @ApiQuery({ name: 'courseId', required: true })
  async getCourseStats(@Query('courseId') courseId: string) {
    try {
      const admin = await this.userService.findAdmin();

      const [students, grades] = await Promise.all([
        this.classroomService.getStudents(admin.googleTokens, courseId),
        this.classroomService.getFullGradebook(admin.googleTokens, courseId),
      ]);

      return {
        courseId,
        studentsCount: students.length,
        students,
        grades,
      };
    } catch (error) {
      this.logger.error(
        `Ошибка получения статистики курса ${courseId}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  @Public()
  @Get('check-email')
  @ApiOperation({ summary: 'Проверить существование email' })
  @ApiQuery({ name: 'email', required: true })
  async checkEmail(@Query('email') email: string) {
    if (!email?.trim()) {
      throw new BadRequestException('Email is required');
    }
    const user = await this.userService.findByEmail(email.toLowerCase().trim());
    return { exists: Boolean(user) };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiParam({ name: 'id' })
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return UserMapper.toResponseDto(user);
  }

  @Get('by-tg/:id')
  @ApiOperation({ summary: 'Получить пользователя по Telegram ID' })
  @ApiParam({ name: 'id' })
  async findByTgId(@Param('id') id: string) {
    const user = await this.userService.findByTgId(id);
    return UserMapper.toResponseDto(user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Обновить пользователя по ID' })
  @ApiParam({ name: 'id' })
  async update(@Param('id') id: string, @Body() updateData: UpdateUserDto) {
    const updatedUser = await this.userService.update(id, updateData);
    return UserMapper.toResponseDto(updatedUser);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Изменить пароль текущего пользователя' })
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    await this.userService.changePassword(changePasswordDto);
    return { message: 'Пароль успешно изменен' };
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Изменить роль пользователя' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['role'],
      properties: { role: { type: 'string' } },
    },
  })
  async changeRole(@Param('id') id: string, @Body('role') role: string) {
    return this.userService.changeRole(id, role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Удалить пользователя' })
  @ApiParam({ name: 'id' })
  async remove(@Param('id') id: string) {
    return this.userService.delete(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Создать пользователя' })
  @ApiBody({ type: NewUserDto })
  async create(@Body() createUserDto: NewUserDto) {
    const user = await this.userService.create(createUserDto);
    return UserMapper.toResponseDto(user);
  }

  // В AuthController
  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Отправить код восстановления в Telegram' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: { email: { type: 'string' } },
    },
  })
  async forgotPassword(@Body('email') email: string) {
    // Генерируем код и получаем tgId пользователя
    const { code, tgId } = await this.userService.generateResetCode(email);

    await this.botApiService.sendMessage(
      tgId,
      `🔐 Ваш код для сброса пароля: <b>${code}</b>. Действует 15 минут.`,
    );

    return { message: 'Код отправлен в ваш Telegram' };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Сбросить пароль по коду' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.userService.resetPasswordWithCode(dto);
    return { message: 'Пароль успешно изменен' };
  }
}
