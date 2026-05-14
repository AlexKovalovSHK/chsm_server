import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SubjectService } from '../service/subject.service';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Subjects')
@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @ApiOperation({ summary: 'Создать предмет' })
  @Post()
  async create(@Body() createDto: CreateSubjectDto) {
    return await this.subjectService.create(createDto);
  }

  @ApiOperation({ summary: 'Получить список предметов' })
  @Get()
  async findAll() {
    return await this.subjectService.findAll();
  }

  @ApiOperation({ summary: 'Получить предмет по ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.subjectService.findOne(id);
  }

  @ApiOperation({ summary: 'Обновить предмет' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSubjectDto,
  ) {
    return await this.subjectService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Удалить предмет' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.subjectService.remove(id);
  }
}
