import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateSessionLevelDto {
  @IsInt()
  @Min(1)
  number: number;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}