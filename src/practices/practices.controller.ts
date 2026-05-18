import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
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
  ): Promise<PracticeDto> {
    return this.practicesService.create(createPracticeDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all practice journals for the current student',
  })
  @ApiResponse({ status: 200, description: 'Success', type: [PracticeDto] })
  findAll(@CurrentUser() user?: JwtPayload): Promise<PracticeDto[]> {
    return this.practicesService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a practice journal by ID with entries' })
  @ApiResponse({ status: 200, description: 'Success', type: PracticeDto })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PracticeDto> {
    return this.practicesService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update practice journal status' })
  @ApiResponse({ status: 200, description: 'Success', type: PracticeDto })
  update(
    @Param('id') id: string,
    @Body() updatePracticeDto: UpdatePracticeDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PracticeDto> {
    return this.practicesService.update(id, updatePracticeDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a practice journal' })
  @ApiResponse({ status: 200, description: 'Success' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.practicesService.remove(id, user);
  }

  // --- Practice Entries ---

  @Post(':practiceId/entries')
  @ApiOperation({ summary: 'Add an entry to a practice journal' })
  @ApiResponse({ status: 201, description: 'Created', type: PracticeEntryDto })
  createEntry(
    @Param('practiceId') practiceId: string,
    @Body() createEntryDto: CreatePracticeEntryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PracticeEntryDto> {
    return this.practicesService.createEntry(practiceId, createEntryDto, user);
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
  ): Promise<PracticeEntryDto[]> {
    return this.practicesService.findEntries(practiceId, user);
  }

  @Patch(':practiceId/entries/:entryId')
  @ApiOperation({ summary: 'Update an entry' })
  @ApiResponse({ status: 200, description: 'Success', type: PracticeEntryDto })
  updateEntry(
    @Param('practiceId') practiceId: string,
    @Param('entryId') entryId: string,
    @Body() updateEntryDto: UpdatePracticeEntryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PracticeEntryDto> {
    return this.practicesService.updateEntry(
      practiceId,
      entryId,
      updateEntryDto,
      user,
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
  ): Promise<void> {
    return this.practicesService.removeEntry(practiceId, entryId, user);
  }
}
