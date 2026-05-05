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

@Controller('grade-entries')
export class GradeEntryController {
  constructor(private readonly gradeEntryService: GradeEntryService) {}

  @Post()
  async create(@Body() createDto: CreateGradeEntryDto) {
    return await this.gradeEntryService.create(createDto);
  }

  @Get()
  async findAll() {
    return await this.gradeEntryService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.gradeEntryService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateDto: UpdateGradeEntryDto
  ) {
    return await this.gradeEntryService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.gradeEntryService.remove(id);
  }
}
