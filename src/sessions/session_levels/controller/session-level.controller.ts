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
import { SessionLevelService } from '../service/session-level.service';
import { CreateSessionLevelDto } from '../dto/create-session-level.dto';
import { UpdateSessionLevelDto } from '../dto/update-session-level.dto';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Session levels')
@Controller('session-levels')
export class SessionLevelController {
  constructor(private readonly service: SessionLevelService) {}

  @ApiOperation({ summary: 'Создать уровень сессии' })
  @Post()
  create(@Body() dto: CreateSessionLevelDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Получить список уровней сессии' })
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @ApiOperation({ summary: 'Получить уровень сессии по ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Обновить уровень сессии' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionLevelDto,
  ) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Удалить уровень сессии' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
