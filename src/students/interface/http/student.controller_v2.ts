import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { StudentService } from 'src/students/application/student.service';
import { StudentFullReportDto } from 'src/students/application/dto/student_full_reaport.dto';

@ApiTags('Students for students')
@Controller('students/v2')
@UseGuards(JwtAuthGuard)
@Roles('student', 'admin', 'teacher')
export class StudentControllerV2 {
  constructor(private readonly studentService: StudentService) {}

  @ApiOperation({ summary: 'Получить полную информацию студента по ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StudentFullReportDto> {
    return await this.studentService.fullreportByStudentId(id);
  }

  @ApiOperation({ summary: 'Получить студента по userID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get('user/:id')
  async findOneByUserId(@Param('id') userId: string) {
    return await this.studentService.findOneByUserId(userId);
  }
}
