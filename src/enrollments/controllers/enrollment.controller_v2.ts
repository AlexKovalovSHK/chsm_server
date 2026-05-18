import { ApiOperation, ApiParam, ApiTags, ApiResponse } from '@nestjs/swagger';
import { EnrollmentService } from '../service/enrollment.service';
import { EnrollmentDto } from '../dto/enrollment.dto';
import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Enrollments-v2 for students')
@Controller('enrollments/v2/students')
@UseGuards(MultiTenancyGuard)
@Roles('student', 'admin', 'teacher')
export class EnrollmentControllerV2 {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @ApiOperation({ summary: 'Получить список зачислений для студента' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: [EnrollmentDto] })
  @Get(':id')
  async findAllByStudentId(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EnrollmentDto[]> {
    return await this.enrollmentService.findAllByStudentId(id);
  }
}
