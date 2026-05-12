import { IsUUID, IsInt, IsString, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateGradeDto {
  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @IsInt()
  @Min(0)
  @Max(100) // Assuming grades are between 0 and 100
  @IsNotEmpty()
  value: number;

  @IsString()
  @IsNotEmpty()
  source: string; // e.g., "Google Classroom", "Manual"
}
