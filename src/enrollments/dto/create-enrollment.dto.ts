import { IsUUID, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class CreateEnrollmentDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  sessionRunId: string;

  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus;

  @IsDateString()
  @IsOptional()
  enrolledAt?: string;
}
