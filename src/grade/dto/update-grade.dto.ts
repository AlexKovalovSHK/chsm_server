import { PartialType } from '@nestjs/mapped-types';
import { CreateGradeDto } from './create-grade.dto';
import { IsUUID, IsInt, IsString, IsOptional, Min, Max } from 'class-validator';

export class UpdateGradeDto extends PartialType(CreateGradeDto) {
  @IsUUID()
  @IsOptional()
  enrollmentId?: string;

  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @IsInt()
  @Min(0)
  @Max(100) // Assuming grades are between 0 and 100
  @IsOptional()
  value?: number;

  @IsString()
  @IsOptional()
  source?: string;
}
