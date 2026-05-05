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
import { GradebookService } from '../service/gradebook.service';
import { CreateGradebookDto } from '../dto/create-gradebook.dto';
import { UpdateGradebookDto } from '../dto/update-gradebook.dto';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Gradebooks')
@Controller('gradebooks')
export class GradebookController {
  constructor(private readonly gradebookService: GradebookService) {}

  @ApiOperation({ summary: 'Создать табель' })
  @Post()
  async create(@Body() createDto: CreateGradebookDto) {
    return await this.gradebookService.create(createDto);
  }

  @ApiOperation({ summary: 'Получить список табелей' })
  @Get()
  async findAll() {
    return await this.gradebookService.findAll();
  }

  @ApiOperation({ summary: 'Получить табель по ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.gradebookService.findOne(id);
  }

  @ApiOperation({ summary: 'Обновить табель' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateDto: UpdateGradebookDto
  ) {
    return await this.gradebookService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Удалить табель' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.gradebookService.remove(id);
  }
}
