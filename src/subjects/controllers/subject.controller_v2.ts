import { ApiTags } from '@nestjs/swagger';
import { SubjectService } from '../service/subject.service';
import { Controller, UseGuards } from '@nestjs/common';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';

@ApiTags('Subjects')
@Controller('subjects/v2')
@UseGuards(MultiTenancyGuard)
export class SubjectControllerV2 {
  constructor(private readonly subjectService: SubjectService) {}
}
