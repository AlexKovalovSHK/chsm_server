import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../users/application/user.service';
import { UserMapper } from '../users/infrastructure/user.mapper';
import { LoginResult } from './auth.types';
import { LoginByTgDto, LoginDto } from './dto/login.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (!user.password) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (user.status.toString() === 'archived') {
      throw new ForbiddenException('Аккаунт заблокирован');
    }

    const payload = {
      sub: user.id.toString(),
      role: user.role.toString(),
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: UserMapper.toResponseDto(user),
    };
  }

  async loginByTg(dto: LoginByTgDto): Promise<LoginResult> {
    const user = await this.userService.findByTgId(dto.tgId);

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id.toString(),
      role: user.role.toString(),
    });

    return {
      accessToken,
      user: UserMapper.toResponseDto(user), // ← как в login()
    };
  }


}
