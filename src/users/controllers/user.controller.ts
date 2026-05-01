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
import { UserMapper } from '../infrastructure/user.mapper';
import { ClassroomService } from '../../classroom/service/classroom.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/decorators/current-user.decorator';
import express from 'express';
import { Public } from 'src/auth/decorators/public.decorator';


@Controller('api/users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly userService: UserService,
    private readonly classroomService: ClassroomService,
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
  getMe(@CurrentUser() user: JwtPayload) {
    return user;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const users = await this.userService.findAll({ search, status });
    return users.map((user) => UserMapper.toResponseDto(user));
  }

  @Get('link-url')
  @UseGuards(JwtAuthGuard)
  async getLinkUrl(@Query('email') email: string) {
    // Формируем state вручную и передаем ОДНИМ аргументом
    const state = `web:${email}`;
    const url = this.classroomService.getAuthUrl(state); // Теперь ошибок нет
    return { url };
  }

  @Public()
  @Get('link')
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
  async getAuthLink(@Query('tgId') tgId: string) {
    if (!tgId) throw new BadRequestException('tgId is required');

    const state = `tg:${tgId}`;
    const url = this.classroomService.getAuthUrl(state);

    return { url };
  }

  @Get('admins/stats')
  @UseGuards(JwtAuthGuard)
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

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return UserMapper.toResponseDto(user);
  }

  @Get('by-tg/:id')
  async findByTgId(@Param('id') id: string) {
    const user = await this.userService.findByTgId(id);
    return UserMapper.toResponseDto(user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateData: UpdateUserDto) {
    const updatedUser = await this.userService.update(id, updateData);
    return UserMapper.toResponseDto(updatedUser);
  }

  @Post(':tgId/add-xp')
  @UseGuards(JwtAuthGuard)
  async rewardUser(
    @Param('tgId') tgId: string,
    @Body('amount') amount: number,
  ) {
    return this.userService.addXp(tgId, amount);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard)
  async changeRole(@Param('id') id: string, @Body('role') role: string) {
    return this.userService.changeRole(id, role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.userService.delete(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createUserDto: NewUserDto) {
    const user = await this.userService.create(createUserDto);
    return UserMapper.toResponseDto(user);
  }
}
