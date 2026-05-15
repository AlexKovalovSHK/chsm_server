import { PartialType } from '@nestjs/swagger';
import { CreatePracticeEntryDto } from './create-practice-entry.dto';

export class UpdatePracticeEntryDto extends PartialType(CreatePracticeEntryDto) {}
