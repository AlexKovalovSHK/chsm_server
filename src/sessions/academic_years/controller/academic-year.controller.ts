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
import { AcademicYearService } from '../service/academic-year.service';
import { CreateAcademicYearDto } from '../dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from '../dto/update-academic-year.dto';
  
  @Controller('academic-years')
  export class AcademicYearController {
    constructor(private readonly academicYearService: AcademicYearService) {}
  
    @Post()
    async create(@Body() createDto: CreateAcademicYearDto) {
      return await this.academicYearService.create(createDto);
    }
  
    @Get()
    async findAll() {
      return await this.academicYearService.findAll();
    }
  
    @Get('current')
    async findCurrent() {
      return await this.academicYearService.findCurrent();
    }
  
    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
      return await this.academicYearService.findOne(id);
    }
  
    @Patch(':id')
    async update(
      @Param('id', ParseUUIDPipe) id: string, 
      @Body() updateDto: UpdateAcademicYearDto
    ) {
      return await this.academicYearService.update(id, updateDto);
    }
  
    @Delete(':id')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
      return await this.academicYearService.remove(id);
    }
  }