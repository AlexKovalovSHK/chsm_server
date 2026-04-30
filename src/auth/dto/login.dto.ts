import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'email не может быть пустым' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'password не может быть пустым' })
  password: string;
}