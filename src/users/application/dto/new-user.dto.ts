import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class NewUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tgId?:string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  username?:string;


  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  registrationStep?:string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?:string;

}
