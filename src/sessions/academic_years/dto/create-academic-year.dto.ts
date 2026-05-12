import { IsString, IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAcademicYearDto {
  @ApiProperty({ example: '2025/2026' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Дата начала в формате ISO-8601' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ description: 'Дата завершения в формате ISO-8601' })
  @IsDateString()
  endsAt: string;
}
