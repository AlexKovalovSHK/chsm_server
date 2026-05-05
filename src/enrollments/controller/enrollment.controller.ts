import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Patch, 
    Param, 
    Delete, 
    ParseUUIDPipe 
  } from '@nestjs/common';
import { EnrollmentService } from '../service/enrollment.service';
import { CreateEnrollmentDto } from '../dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from '../dto/update-enrollment.dto';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Enrollments')
@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @ApiOperation({ summary: 'Создать зачисление' })
  @Post()
  async create(@Body() createDto: CreateEnrollmentDto) {
    return await this.enrollmentService.create(createDto);
  }

  @ApiOperation({ summary: 'Получить список зачислений' })
  @Get()
  async findAll() {
    return await this.enrollmentService.findAll();
  }

  @ApiOperation({ summary: 'Получить зачисление по ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.enrollmentService.findOne(id);
  }

  @ApiOperation({ summary: 'Обновить зачисление' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateDto: UpdateEnrollmentDto
  ) {
    return await this.enrollmentService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Удалить зачисление' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.enrollmentService.remove(id);
  }
}
