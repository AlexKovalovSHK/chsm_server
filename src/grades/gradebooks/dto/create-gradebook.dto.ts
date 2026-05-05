import { IsUUID, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { GradebookStatus } from '@prisma/client';

export class CreateGradebookDto {
  @IsUUID()
  enrollmentId: string;

  @IsEnum(GradebookStatus)
  @IsOptional()
  status?: GradebookStatus;

  @IsDateString()
  @IsOptional()
  approvedAt?: string;

  @IsString()
  @IsOptional()
  approvedBy?: string;
}
