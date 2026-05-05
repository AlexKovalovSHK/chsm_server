import { 
    Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe 
  } from '@nestjs/common';
import { SessionLevelService } from '../service/session-level.service';
import { CreateSessionLevelDto } from '../dto/create-session-level.dto';
import { UpdateSessionLevelDto } from '../dto/update-session-level.dto';
  
  @Controller('session-levels')
  export class SessionLevelController {
    constructor(private readonly service: SessionLevelService) {}
  
    @Post()
    create(@Body() dto: CreateSessionLevelDto) {
      return this.service.create(dto);
    }
  
    @Get()
    findAll() {
      return this.service.findAll();
    }
  
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
      return this.service.findOne(id);
    }
  
    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSessionLevelDto) {
      return this.service.update(id, dto);
    }
  
    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
      return this.service.remove(id);
    }
  }