import { PartialType } from '@nestjs/swagger';
import { CreateGradeEntryDto } from './create-grade-entry.dto';

export class UpdateGradeEntryDto extends PartialType(CreateGradeEntryDto) {}
