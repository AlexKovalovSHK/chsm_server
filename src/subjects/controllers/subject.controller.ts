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
import { SubjectService } from '../service/subject.service';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';

@ApiTags('Subjects')
@Controller('subjects')
@UseGuards(MultiTenancyGuard)
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @ApiOperation({ summary: 'Создать предмет' })
  @Post()
  async create(@Body() createDto: CreateSubjectDto, @Req() req: Request) {
    const orgId =
      (req.headers['x-org-id'] as string) || (req as any).currentOrgId;
    return await this.subjectService.create(createDto, orgId);
  }

  @ApiOperation({ summary: 'Получить список предметов' })
  @Get()
  async findAll(@Req() req: Request) {
    const orgId =
      (req.headers['x-org-id'] as string) || (req as any).currentOrgId;
    return await this.subjectService.findAll(orgId);
  }

  @ApiOperation({ summary: 'Получить предмет по ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const orgId =
      (req.headers['x-org-id'] as string) || (req as any).currentOrgId;
    return await this.subjectService.findOne(id, orgId);
  }

  @ApiOperation({ summary: 'Обновить предмет' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSubjectDto,
    @Req() req: Request,
  ) {
    const orgId =
      (req.headers['x-org-id'] as string) || (req as any).currentOrgId;
    return await this.subjectService.update(id, updateDto, orgId);
  }

  @ApiOperation({ summary: 'Удалить предмет' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const orgId =
      (req.headers['x-org-id'] as string) || (req as any).currentOrgId;
    return await this.subjectService.remove(id, orgId);
  }
}
