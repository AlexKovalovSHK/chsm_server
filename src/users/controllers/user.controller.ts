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
} from '@nestjs/common';
import { UserService } from '../application/user.service';
import { ClassroomService } from '../../classroom/service/classroom.service';

@Controller('api/users')
export class UserController {
    private readonly logger = new Logger(ClassroomService.name);

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

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.userService.findAll({ search, status });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // В админке обычно используют системный ID, а не TG ID
    return this.userService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.userService.update(id, updateData);
  }

  @Post(':tgId/add-xp')
  async rewardUser(
    @Param('tgId') tgId: string,
    @Body('amount') amount: number,
  ) {
    return this.userService.addXp(tgId, amount);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    // Используем мягкое удаление, чтобы не терять историю в базе
    return this.userService.softDelete(id);
  }

// src/users/controllers/user.controller.ts

@Get('admins/stats')
async getCourseStats(@Query('courseId') courseId: string) {
  try {
    // 1. Ищем админа
    const admin = await this.userService.findAdmin();

    // 2. Параллельно запрашиваем данные из Google (так быстрее, чем по очереди)
    const [students, grades] = await Promise.all([
      this.classroomService.getStudents(admin.googleTokens, courseId),
      this.classroomService.getFullGradebook(admin.googleTokens, courseId),
    ]);

    // 3. Возвращаем данные для React
    // Мы можем также добавить название курса, если нужно
    return {
      courseId,
      studentsCount: students.length,
      students, // Список учеников с их именами и ID
      grades,   // Ведомость (задания и оценки)
    };
  } catch (error) {
    this.logger.error(`Ошибка получения статистики курса ${courseId}: ${error.message}`);
    throw error;
  }
}
}
