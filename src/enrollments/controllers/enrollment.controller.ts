import { EnrollmentService } from '../service/enrollment.service';
import { CreateEnrollmentDto } from '../dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from '../dto/update-enrollment.dto';
import { ApprovedEnrollment } from '../dto/apruve-enrollment.dto';
import { EnrollmentDto } from '../dto/enrollment.dto';
import { ApiOperation, ApiParam, ApiTags, ApiResponse } from '@nestjs/swagger';
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';

@ApiTags('Enrollments')
@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @ApiOperation({ summary: 'Создать зачисление' })
  @ApiResponse({ status: 201, type: EnrollmentDto })
  @Post()
  async create(@Body() createDto: CreateEnrollmentDto): Promise<EnrollmentDto> {
    return await this.enrollmentService.create(createDto);
  }

  @ApiOperation({ summary: 'Получить список зачислений' })
  @ApiResponse({ status: 200, type: [EnrollmentDto] })
  @Get()
  async findAll(): Promise<EnrollmentDto[]> {
    return await this.enrollmentService.findAll();
  }

  @ApiOperation({ summary: 'Получить список зачислений для студента' })
  @ApiResponse({ status: 200, type: [EnrollmentDto] })
  @Get('students/:id')
  async findAllByStudentId(@Param('id') id: string): Promise<EnrollmentDto[]> {
    return await this.enrollmentService.findAllByStudentId(id);
  }

  @ApiOperation({ summary: 'Получить зачисление по ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: EnrollmentDto })
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EnrollmentDto> {
    return await this.enrollmentService.findOne(id);
  }

  @ApiOperation({ summary: 'Обновить зачисление' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: EnrollmentDto })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateEnrollmentDto,
  ): Promise<EnrollmentDto> {
    return await this.enrollmentService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Удалить зачисление' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200 })
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.enrollmentService.remove(id);
  }

  @ApiOperation({ summary: 'Одобрить (аппрувить) зачисление' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: EnrollmentDto })
  @Patch(':id/approve')
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovedEnrollment,
  ): Promise<EnrollmentDto> {
    return await this.enrollmentService.approve(id, dto);
  }
}
