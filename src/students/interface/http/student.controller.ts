import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { StudentService } from '../../application/student.service';
import { CreateStudentDto } from '../../application/dto/create-student.dto';
import { UpdateStudentDto } from '../../application/dto/update-student.dto';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';

@ApiTags('Students')
@Controller('students')
@UseGuards(MultiTenancyGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @ApiOperation({ summary: 'Создать студента' })
  @Post()
  async create(@Body() createDto: CreateStudentDto) {
    console.log(createDto);

    return await this.studentService.create(createDto);
  }

  @ApiOperation({ summary: 'Получить список студентов' })
  @Get()
  async findAll() {
    return await this.studentService.findAll();
  }

  @ApiOperation({ summary: 'Получить студента по ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.studentService.findOne(id);
  }

  @ApiOperation({ summary: 'Обновить студента' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateStudentDto,
  ) {
    return await this.studentService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Удалить студента' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.studentService.remove(id);
  }
}
