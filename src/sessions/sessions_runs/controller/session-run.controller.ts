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
import { SessionRunService } from '../service/session-run.service';
import { CreateSessionRunDto } from '../dto/create-session-run.dto';
import { UpdateSessionRunDto } from '../dto/update-session-run.dto';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';

@ApiTags('Session runs')
@Controller('session-runs')
@UseGuards(MultiTenancyGuard)
export class SessionRunController {
  constructor(private readonly service: SessionRunService) {}

  @ApiOperation({ summary: 'Создать запуск сессии' })
  @Post()
  create(@Req() req: Request, @Body() dto: CreateSessionRunDto) {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.service.create(dto, orgId);
  }

  @ApiOperation({ summary: 'Получить список запусков сессии' })
  @Get()
  findAll(@Req() req: Request) {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.service.findAll(orgId);
  }

  @ApiOperation({ summary: 'Получить запуск сессии по ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id')
  findOne(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.service.findOne(id, orgId);
  }

  @ApiOperation({ summary: 'Обновить запуск сессии' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionRunDto,
  ) {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.service.update(id, dto, orgId);
  }

  @ApiOperation({ summary: 'Удалить запуск сессии' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Delete(':id')
  remove(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.service.remove(id, orgId);
  }
}
