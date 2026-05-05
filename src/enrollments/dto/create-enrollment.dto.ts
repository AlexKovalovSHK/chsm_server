import { IsUUID, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEnrollmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sessionRunId: string;

  @ApiPropertyOptional({ enum: EnrollmentStatus })
  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus;

  @ApiPropertyOptional({ description: 'Дата зачисления в формате ISO-8601' })
  @IsDateString()
  @IsOptional()
  enrolledAt?: string;
}
