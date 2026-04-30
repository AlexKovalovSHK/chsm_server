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
} from '@nestjs/common';
import { UserService } from '../application/user.service';
import { ClassroomService } from '../../classroom/service/classroom.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
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
  getMe(@CurrentUser() user: JwtPayload) {
    return user;
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.userService.findAll({ search, status });
  }

  @Get('admins/stats')
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
      this.logger.error(`Ошибка получения статистики курса ${courseId}: ${(error as Error).message}`);
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
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

  @Patch(':id/role')
  async changeRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    return this.userService.changeRole(id, role);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.userService.softDelete(id);
  }
}
