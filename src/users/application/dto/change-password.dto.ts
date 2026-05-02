import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';



export class ChangePasswordDto {
  @ApiProperty({ description: 'ID пользователя' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Текущий пароль пользователя' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ description: 'Новый пароль пользователя', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
