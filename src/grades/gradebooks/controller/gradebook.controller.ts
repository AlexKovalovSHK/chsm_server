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

@Controller('gradebooks')
export class GradebookController {
  constructor(private readonly gradebookService: GradebookService) {}

  @Post()
  async create(@Body() createDto: CreateGradebookDto) {
    return await this.gradebookService.create(createDto);
  }

  @Get()
  async findAll() {
    return await this.gradebookService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.gradebookService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateDto: UpdateGradebookDto
  ) {
    return await this.gradebookService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.gradebookService.remove(id);
  }
}
