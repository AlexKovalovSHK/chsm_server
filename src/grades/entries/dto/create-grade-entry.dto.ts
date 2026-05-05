import { IsUUID, IsInt, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGradeEntryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  enrollmentId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  subjectId: string;

  @ApiProperty({ example: 5, description: 'Оценка' })
  @IsInt()
  value: number;

  @ApiPropertyOptional({ example: 'google_classroom' })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ description: 'Дата выставления оценки в формате ISO-8601' })
  @IsDateString()
  @IsOptional()
  recordedAt?: string;
}
