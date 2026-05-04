import { IsEmail, IsNotEmpty, IsString, MinLength, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Некорректный формат Email' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Код обязателен' })
  @Length(6, 6, { message: 'Код должен состоять из 6 цифр' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Новый пароль не может быть пустым' })
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  newPassword: string;
}