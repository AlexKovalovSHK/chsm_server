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
import { GradeEntryService } from '../service/grade-entry.service';
import { CreateGradeEntryDto } from '../dto/create-grade-entry.dto';
import { UpdateGradeEntryDto } from '../dto/update-grade-entry.dto';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Grade entries')
@Controller('grade-entries')
export class GradeEntryController {
  constructor(private readonly gradeEntryService: GradeEntryService) {}

  @ApiOperation({ summary: 'Создать оценку' })
  @Post()
  async create(@Body() createDto: CreateGradeEntryDto) {
    return await this.gradeEntryService.create(createDto);
  }

  @ApiOperation({ summary: 'Получить список оценок' })
  @Get()
  async findAll() {
    return await this.gradeEntryService.findAll();
  }

  @ApiOperation({ summary: 'Получить оценку по ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.gradeEntryService.findOne(id);
  }

  @ApiOperation({ summary: 'Обновить оценку' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateDto: UpdateGradeEntryDto
  ) {
    return await this.gradeEntryService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Удалить оценку' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.gradeEntryService.remove(id);
  }
}
