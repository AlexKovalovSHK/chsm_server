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
import { StudentService } from '../service/student.service';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';

@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  async create(@Body() createDto: CreateStudentDto) {
    return await this.studentService.create(createDto);
  }

  @Get()
  async findAll() {
    return await this.studentService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.studentService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateDto: UpdateStudentDto
  ) {
    return await this.studentService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.studentService.remove(id);
  }
}
