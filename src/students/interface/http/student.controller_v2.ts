import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
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
    @Req() req: Request,
  ): Promise<StudentFullReportDto> {
    const orgId =
      (req.headers['x-org-id'] as string) || (req as any).currentOrgId;
    return await this.studentService.fullreportByStudentId(id, orgId);
  }

  @ApiOperation({ summary: 'Получить студента по userID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get('user/:id')
  async findOneByUserId(@Param('id') userId: string, @Req() req: Request) {
    const orgId =
      (req.headers['x-org-id'] as string) || (req as any).currentOrgId;
    return await this.studentService.findOneByUserId(userId, orgId);
  }
}
