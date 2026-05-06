import { IsString, IsInt, IsOptional, IsUUID, IsNotEmpty, IsBoolean } from 'class-validator';
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

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  teacherName?: string;

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
}
