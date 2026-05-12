import { Controller, Get, Post, Put, Delete, Param, Body, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { GradeService } from '../service/grade.service';
import { CreateGradeDto } from '../dto/create-grade.dto';
import { UpdateGradeDto } from '../dto/update-grade.dto';
import { GradeEntry } from '@prisma/client';

@Controller('grades')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createGradeDto: CreateGradeDto): Promise<GradeEntry> {
    return this.gradeService.createGrade(createGradeDto);
  }

  @Get()
  async findAll(): Promise<GradeEntry[]> {
    return this.gradeService.findAllGrades();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GradeEntry> {
    return this.gradeService.findGradeById(id);
  }

  @Get('enrollment/:enrollmentId')
  async findByEnrollmentId(@Param('enrollmentId') enrollmentId: string): Promise<GradeEntry[]> {
    return this.gradeService.findGradesByEnrollmentId(enrollmentId);
  }

  @Get('subject/:subjectId')
  async findBySubjectId(@Param('subjectId') subjectId: string): Promise<GradeEntry[]> {
    return this.gradeService.findGradesBySubjectId(subjectId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateGradeDto: UpdateGradeDto): Promise<GradeEntry> {
    return this.gradeService.updateGrade(id, updateGradeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.gradeService.deleteGrade(id);
  }
}
