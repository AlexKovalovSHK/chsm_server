import { IsString, IsInt, IsOptional, IsUUID, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateStudentDto {
  @IsInt()
  userId: number;

  @IsString()
  @IsNotEmpty()
  instrument: string;

  @IsString()
  @IsNotEmpty()
  specialization: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  telegramId?: string;

  @IsString()
  @IsOptional()
  classroomUserId?: string;

  @IsDateString()
  @IsOptional()
  enrolledAt?: string;
}
