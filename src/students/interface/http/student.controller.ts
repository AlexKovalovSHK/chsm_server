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
  Req,
} from '@nestjs/common';
import { StudentService } from '../../application/student.service';
import { CreateStudentDto } from '../../application/dto/create-student.dto';
import { UpdateStudentDto } from '../../application/dto/update-student.dto';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';

@ApiTags('Students')
@Controller('students')
@UseGuards(MultiTenancyGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @ApiOperation({ summary: 'Создать студента' })
  @Post()
  async create(@Body() createDto: CreateStudentDto, @Req() req: Request) {
    console.log(createDto);

    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;

    return await this.studentService.create(createDto, orgId);
  }

  @ApiOperation({ summary: 'Получить список студентов' })
  @Get()
  async findAll(@Req() req: Request) {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;

    return await this.studentService.findAll(orgId);
  }

  @ApiOperation({ summary: 'Получить студента по ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;

    return await this.studentService.findOne(id, orgId);
  }

  @ApiOperation({ summary: 'Обновить студента' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateStudentDto,
    @Req() req: Request,
  ) {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;

    return await this.studentService.update(id, updateDto, orgId);
  }

  @ApiOperation({ summary: 'Удалить студента' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;

    return await this.studentService.remove(id, orgId);
  }
}
