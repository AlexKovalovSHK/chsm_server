import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PracticeEntryDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  practiceId: string;

  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiPropertyOptional({ type: String, nullable: true })
  serviceKind: string | null;

  @Expose()
  @ApiPropertyOptional({ type: String, nullable: true })
  location: string | null;

  @Expose()
  @ApiProperty()
  date: string;

  @Expose()
  @ApiPropertyOptional({ type: String, nullable: true })
  approvedAt: string | null;

  @Expose()
  @ApiPropertyOptional({ type: String, nullable: true })
  approvedBy: string | null;
}
