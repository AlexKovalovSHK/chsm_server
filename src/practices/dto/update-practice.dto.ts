import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum PracticeStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
}

export class UpdatePracticeDto {
  @ApiPropertyOptional({ enum: PracticeStatus })
  @IsEnum(PracticeStatus)
  @IsOptional()
  practiceStatus?: PracticeStatus;
}
