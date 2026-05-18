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
import { AcademicYearService } from '../service/academic-year.service';
import { CreateAcademicYearDto } from '../dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from '../dto/update-academic-year.dto';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';

@ApiTags('Academic years')
@Controller('academic-years')
@UseGuards(MultiTenancyGuard)
export class AcademicYearController {
  constructor(private readonly academicYearService: AcademicYearService) {}

  @ApiOperation({ summary: 'Создать учебный год' })
  @Post()
  async create(@Body() createDto: CreateAcademicYearDto) {
    return await this.academicYearService.create(createDto);
  }

  @ApiOperation({ summary: 'Получить все учебные годы' })
  @Get()
  async findAll() {
    return await this.academicYearService.findAll();
  }

  @ApiOperation({ summary: 'Получить текущий учебный год' })
  @Get('current')
  async findCurrent() {
    return await this.academicYearService.findCurrent();
  }

  @ApiOperation({ summary: 'Получить учебный год по ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.academicYearService.findOne(id);
  }

  @ApiOperation({ summary: 'Обновить учебный год' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateAcademicYearDto,
  ) {
    return await this.academicYearService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Удалить учебный год' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.academicYearService.remove(id);
  }
}
