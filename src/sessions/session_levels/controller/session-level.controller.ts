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
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { SessionLevelService } from '../service/session-level.service';
import { CreateSessionLevelDto } from '../dto/create-session-level.dto';
import { UpdateSessionLevelDto } from '../dto/update-session-level.dto';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';

@ApiTags('Session levels')
@Controller('session-levels')
@UseGuards(MultiTenancyGuard)
export class SessionLevelController {
  constructor(private readonly service: SessionLevelService) {}

  @ApiOperation({ summary: 'Создать уровень сессии' })
  @Post()
  create(@Body() dto: CreateSessionLevelDto, @Req() req: Request) {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.service.create(dto, orgId);
  }

  @ApiOperation({ summary: 'Получить список уровней сессии' })
  @Get()
  findAll(@Req() req: Request) {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.service.findAll(orgId);
  }

  @ApiOperation({ summary: 'Получить уровень сессии по ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.service.findOne(id, orgId);
  }

  @ApiOperation({ summary: 'Обновить уровень сессии' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionLevelDto,
    @Req() req: Request,
  ) {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.service.update(id, dto, orgId);
  }

  @ApiOperation({ summary: 'Удалить уровень сессии' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.service.remove(id, orgId);
  }
}
