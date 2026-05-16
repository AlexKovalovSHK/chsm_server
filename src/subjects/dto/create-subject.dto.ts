import {
  IsString,
  IsInt,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubjectDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  levelId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sessionRunId: string;

  @ApiProperty({ example: 'Music Theory' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 72 })
  @IsInt()
  @IsOptional()
  hours?: number;

  @ApiPropertyOptional({ example: 'coursework_42' })
  @IsString()
  @IsOptional()
  classroomCourseworkId?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  hasClassroom?: boolean;

  @ApiProperty({
    example: 100,
    description: 'The maximum scale for grades in this subject',
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(3)
  scale: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  isCore: boolean;
}
