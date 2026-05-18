import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PracticesService } from './practices.service';
import { CreatePracticeDto } from './dto/create-practice.dto';
import { UpdatePracticeDto } from './dto/update-practice.dto';
import { CreatePracticeEntryDto } from './dto/create-practice-entry.dto';
import { UpdatePracticeEntryDto } from './dto/update-practice-entry.dto';
import { ApprovePracticeEntryDto } from './dto/approve-practice-entry.dto';
import { PracticeDto } from './dto/practice.dto';
import { PracticeEntryDto } from './dto/practice-entry.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import type { Request } from 'express';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';

@ApiTags('practices')
@Roles('admin', 'teacher', 'student')
@Controller('practices')
@UseGuards(MultiTenancyGuard)
export class PracticesController {
  constructor(private readonly practicesService: PracticesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a practice journal for a student' })
  @ApiResponse({ status: 201, description: 'Created', type: PracticeDto })
  create(
    @Body() createPracticeDto: CreatePracticeDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PracticeDto> {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.practicesService.create(createPracticeDto, user, orgId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all practice journals for the current student',
  })
  @ApiResponse({ status: 200, description: 'Success', type: [PracticeDto] })
  findAll(
    @Req() req: Request,
    @CurrentUser() user?: JwtPayload,
  ): Promise<PracticeDto[]> {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.practicesService.findAll(orgId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a practice journal by ID with entries' })
  @ApiResponse({ status: 200, description: 'Success', type: PracticeDto })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PracticeDto> {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.practicesService.findOne(id, user, orgId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update practice journal status' })
  @ApiResponse({ status: 200, description: 'Success', type: PracticeDto })
  update(
    @Param('id') id: string,
    @Body() updatePracticeDto: UpdatePracticeDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PracticeDto> {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.practicesService.update(id, updatePracticeDto, user, orgId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a practice journal' })
  @ApiResponse({ status: 200, description: 'Success' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<void> {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.practicesService.remove(id, user, orgId);
  }

  // --- Practice Entries ---

  @Post(':practiceId/entries')
  @ApiOperation({ summary: 'Add an entry to a practice journal' })
  @ApiResponse({ status: 201, description: 'Created', type: PracticeEntryDto })
  createEntry(
    @Param('practiceId') practiceId: string,
    @Body() createEntryDto: CreatePracticeEntryDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PracticeEntryDto> {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.practicesService.createEntry(
      practiceId,
      createEntryDto,
      user,
      orgId,
    );
  }

  @Get(':practiceId/entries')
  @ApiOperation({ summary: 'Get all entries for a practice journal' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: [PracticeEntryDto],
  })
  findEntries(
    @Param('practiceId') practiceId: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PracticeEntryDto[]> {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.practicesService.findEntries(practiceId, user, orgId);
  }

  @Patch(':practiceId/entries/:entryId')
  @ApiOperation({ summary: 'Update an entry' })
  @ApiResponse({ status: 200, description: 'Success', type: PracticeEntryDto })
  updateEntry(
    @Param('practiceId') practiceId: string,
    @Param('entryId') entryId: string,
    @Body() updateEntryDto: UpdatePracticeEntryDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PracticeEntryDto> {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.practicesService.updateEntry(
      practiceId,
      entryId,
      updateEntryDto,
      user,
      orgId,
    );
  }

  @Patch(':practiceId/entries/:entryId/approve')
  @ApiOperation({ summary: 'Approve an entry (admin only)' })
  @ApiResponse({ status: 200, description: 'Success', type: PracticeEntryDto })
  approveEntry(
    @Param('practiceId') practiceId: string,
    @Param('entryId') entryId: string,
    @Body() approveDto: ApprovePracticeEntryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PracticeEntryDto> {
    return this.practicesService.approveEntry(
      practiceId,
      entryId,
      approveDto.approvedBy,
      user,
    );
  }

  @Delete(':practiceId/entries/:entryId')
  @ApiOperation({ summary: 'Delete an entry' })
  @ApiResponse({ status: 200, description: 'Success' })
  removeEntry(
    @Param('practiceId') practiceId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<void> {
    const orgId = (req.headers['x-org-id'] ||
      (req as any).currentOrgId) as string;
    return this.practicesService.removeEntry(practiceId, entryId, user, orgId);
  }
}
