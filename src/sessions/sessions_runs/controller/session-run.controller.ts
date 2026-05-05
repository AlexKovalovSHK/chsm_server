import { 
    Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe 
  } from '@nestjs/common';
import { SessionRunService } from '../service/session-run.service';
import { CreateSessionRunDto } from '../dto/create-session-run.dto';
import { UpdateSessionRunDto } from '../dto/update-session-run.dto';
  
  @Controller('session-runs')
  export class SessionRunController {
    constructor(private readonly service: SessionRunService) {}
  
    @Post()
    create(@Body() dto: CreateSessionRunDto) {
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
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSessionRunDto) {
      return this.service.update(id, dto);
    }
  
    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
      return this.service.remove(id);
    }
  }