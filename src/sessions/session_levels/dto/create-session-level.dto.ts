import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionLevelDto {
  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  number: number;

  @ApiProperty({ example: 'Начальный уровень' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Описание уровня' })
  @IsString()
  @IsOptional()
  description?: string;
}
