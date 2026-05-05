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

@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  async create(@Body() createDto: CreateEnrollmentDto) {
    return await this.enrollmentService.create(createDto);
  }

  @Get()
  async findAll() {
    return await this.enrollmentService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.enrollmentService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateDto: UpdateEnrollmentDto
  ) {
    return await this.enrollmentService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.enrollmentService.remove(id);
  }
}
