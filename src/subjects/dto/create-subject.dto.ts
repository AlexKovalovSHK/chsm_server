import { IsString, IsInt, IsOptional, IsUUID, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreateSubjectDto {
  @IsUUID()
  levelId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  teacherName?: string;

  @IsInt()
  @IsOptional()
  hours?: number;

  @IsString()
  @IsOptional()
  classroomCourseworkId?: string;

  @IsBoolean()
  @IsOptional()
  hasClassroom?: boolean;
}
