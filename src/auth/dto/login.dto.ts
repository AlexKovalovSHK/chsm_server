import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  @IsString()
  @IsNotEmpty({ message: 'email не может быть пустым' })
  email: string;

  @ApiProperty({ example: 'secret123', description: 'Пароль пользователя' })
  @IsString()
  @IsNotEmpty({ message: 'password не может быть пустым' })
  password: string;
}
