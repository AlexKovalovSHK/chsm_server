import {
  IsString,
  IsInt,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ example: 101 })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Trumpet' })
  @IsString()
  @IsNotEmpty()
  instrument: string;

  @ApiProperty({ example: 'Jazz' })
  @IsString()
  @IsNotEmpty()
  specialization: string;

  @ApiProperty({ example: 'Ivan Ivanov' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Ivan Ivanov' })
  @IsString()
  @IsNotEmpty()
  nameRu: string;

  @ApiProperty({ example: 'London' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'EN' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsString()
  @IsOptional()
  telegramId?: string;

  @ApiPropertyOptional({ example: 'google_user_123' })
  @IsString()
  @IsOptional()
  classroomUserId?: string;

  @ApiPropertyOptional({ description: 'Дата зачисления в формате ISO-8601' })
  @IsDateString()
  @IsOptional()
  enrolledAt?: string;
}
