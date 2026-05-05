import { 
    Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe 
  } from '@nestjs/common';
import { SessionRunService } from '../service/session-run.service';
import { CreateSessionRunDto } from '../dto/create-session-run.dto';
import { UpdateSessionRunDto } from '../dto/update-session-run.dto';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
  
  @ApiTags('Session runs')
  @Controller('session-runs')
  export class SessionRunController {
    constructor(private readonly service: SessionRunService) {}
  
    @ApiOperation({ summary: 'Создать запуск сессии' })
    @Post()
    create(@Body() dto: CreateSessionRunDto) {
      return this.service.create(dto);
    }
  
    @ApiOperation({ summary: 'Получить список запусков сессии' })
    @Get()
    findAll() {
      return this.service.findAll();
    }
  
    @ApiOperation({ summary: 'Получить запуск сессии по ID' })
    @ApiParam({ name: 'id', format: 'uuid' })
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
      return this.service.findOne(id);
    }
  
    @ApiOperation({ summary: 'Обновить запуск сессии' })
    @ApiParam({ name: 'id', format: 'uuid' })
    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSessionRunDto) {
      return this.service.update(id, dto);
    }
  
    @ApiOperation({ summary: 'Удалить запуск сессии' })
    @ApiParam({ name: 'id', format: 'uuid' })
    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
      return this.service.remove(id);
    }
  }