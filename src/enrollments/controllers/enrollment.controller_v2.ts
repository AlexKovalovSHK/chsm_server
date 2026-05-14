import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { EnrollmentService } from "../service/enrollment.service";
import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';


@ApiTags('Enrollments-v2 for students')
@Controller('enrollments/v2/students')
@UseGuards(JwtAuthGuard)
export class EnrollmentControllerV2 {
    constructor(private readonly enrollmentService: EnrollmentService) {}
    
     @ApiOperation({ summary: 'Получить список зачислений для студента' })
      @Get(':id')
      async findAllByStudentId(@Param('id') id: string) {
        return await this.enrollmentService.findAllByStudentId(id);
      }
}