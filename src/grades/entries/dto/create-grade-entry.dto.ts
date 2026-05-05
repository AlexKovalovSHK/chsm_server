import { IsUUID, IsInt, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateGradeEntryDto {
  @IsUUID()
  enrollmentId: string;

  @IsUUID()
  subjectId: string;

  @IsInt()
  value: number;

  @IsString()
  @IsOptional()
  source?: string;

  @IsDateString()
  @IsOptional()
  recordedAt?: string;
}
