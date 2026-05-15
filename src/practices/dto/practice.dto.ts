import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PracticeEntryDto } from './practice-entry.dto';

export class PracticeDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  enrollmentId: string;

  @Expose()
  @ApiProperty()
  practiceType: string;

  @Expose()
  @ApiProperty()
  practiceStatus: string;

  @Expose()
  @Type(() => PracticeEntryDto)
  @ApiPropertyOptional({ type: () => [PracticeEntryDto] })
  entries?: PracticeEntryDto[];
}
