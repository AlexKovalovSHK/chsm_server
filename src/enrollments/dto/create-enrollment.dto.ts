import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsString,
  IsNotEmpty,
} from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Дата подтверждения в формате ISO-8601' })
  @IsDateString()
  @IsOptional()
  approvedAt?: string;

  @ApiPropertyOptional({
    description: 'ID или имя пользователя, подтвердившего зачисление',
  })
  @IsString()
  @IsOptional()
  approvedBy?: string;

  @ApiPropertyOptional({ description: 'Имя преподавателя' })
  @IsString()
  @IsOptional()
  teacherName?: string;
}
