import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApprovePracticeEntryDto {
  @ApiPropertyOptional({ description: 'If not provided, can be inferred from the current user (guard)' })
  @IsString()
  @IsOptional()
  approvedBy?: string;
}
