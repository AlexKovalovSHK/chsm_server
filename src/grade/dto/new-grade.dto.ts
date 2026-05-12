import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsUUID } from "class-validator";


export class CreateGradeDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    enrollmentId: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    subjectId: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    value: number;
  
    @IsOptional()
    source?: string;
  
    @ApiPropertyOptional({ description: 'Дата зачисления в формате ISO-8601' })
    @IsDateString()
    @IsOptional()
    recordedAt?: string;
  }