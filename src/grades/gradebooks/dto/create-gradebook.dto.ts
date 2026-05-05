import { IsUUID, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { GradebookStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGradebookDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  enrollmentId: string;

  @ApiPropertyOptional({ enum: GradebookStatus })
  @IsEnum(GradebookStatus)
  @IsOptional()
  status?: GradebookStatus;

  @ApiPropertyOptional({ description: 'Дата подтверждения в формате ISO-8601' })
  @IsDateString()
  @IsOptional()
  approvedAt?: string;

  @ApiPropertyOptional({ example: 'admin@school.local' })
  @IsString()
  @IsOptional()
  approvedBy?: string;
}
