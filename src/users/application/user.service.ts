import {
  Injectable,
  Inject,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from '../domain/user.entity';
import { UserRole } from '../domain/value-objects/user-role.vo';
import { UserStatus } from '../domain/value-objects/user-status.vo';
import { UpdateUserDto } from './dto/update-user.dto';
import { NewUserDto } from './dto/new-user.dto';
import * as userRepositoryInterface from '../domain/user.repository.interface';
import * as bcrypt from 'bcrypt';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository')
    private readonly repo: userRepositoryInterface.IUserRepository,
  ) {}

  async findAll(filters: userRepositoryInterface.UserFilter) {
    return this.repo.findAll(filters);
  }

  async findById(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async findByTgId(tgId: string) {
    const user = await this.repo.findByTgId(tgId);
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async findByEmail(email: string) {
    return this.repo.findByEmail(email);
  }

  async findByGoogleId(googleId: string) {
    return this.repo.findByGoogleId(googleId);
  }

  async update(id: string, updateData: UpdateUserDto) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('Пользователь не найден');

    // Если у пользователя нет пароля, но есть email (пришедший или существующий), создаем его
    const emailForPassword = updateData.email || user.email;
    if (!user.password && emailForPassword) {
      const cleanEmail = emailForPassword.toLowerCase().trim();
      (updateData as any).password = await bcrypt.hash(cleanEmail, 10);
    }

    user.updateDetails(updateData);
    return this.repo.save(user);
  }

  async changeRole(id: string, role: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('Пользователь не найден');

    user.changeRole(UserRole.fromString(role));
    return this.repo.save(user);
  }

  async upsertFromTelegram(tgUser: {
    id: number;
    first_name: string;
    last_name?: string;
  }) {
    let user = await this.repo.findByTgId(tgUser.id.toString());

    if (user) {
      user.updateProfile(tgUser.first_name, tgUser.last_name || '');
      user.activate();
    } else {
      user = User.create({
        firstName: tgUser.first_name,
        lastName: tgUser.last_name || '',
        tgId: tgUser.id.toString(),
      });
    }

    return this.repo.save(user);
  }

  async saveGoogleTokens(
    state: string,
    googleEmail: string,
    tokens: any,
    profile: any,
  ) {
    let user: User | null = null;

    // 1. Пытаемся найти пользователя по state (tgId или email)
    if (state.startsWith('tg:')) {
      const tgId = state.split(':')[1];
      user = await this.repo.findByTgId(tgId);
    } else if (state.startsWith('email:')) {
      const email = state.split(':')[1];
      user = await this.repo.findByEmail(email.toLowerCase());
    }

    // 2. Если по state не нашли, пробуем найти по почте, которую вернул сам Google
    if (!user) {
      user = await this.repo.findByEmail(googleEmail.toLowerCase());
    }

    // 3. Если пользователь найден — обновляем его через доменный метод
    if (user) {
      user.linkGoogle(googleEmail.toLowerCase(), tokens, profile);
      // Метод linkGoogle внутри сущности сам обновит googleId, email и токены
      return this.repo.save(user);
    }

    // 4. Опционально: Если пользователя нет, можно создать нового (Login with Google)
    const newUser = User.create({
      firstName: profile.given_name || 'Google User',
      lastName: profile.family_name || '',
      email: googleEmail.toLowerCase(),
      googleId: profile.id,
      googleTokens: tokens,
      photoUrl: profile.picture,
      isVerified: true,
    });

    return this.repo.save(newUser);
  }

  async addXp(tgId: string, amount: number) {
    const user = await this.repo.findByTgId(tgId);
    if (!user) throw new NotFoundException('Пользователь не найден');

    const result = user.addXp(amount);
    await this.repo.save(user);

    return result;
  }

  async softDelete(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('Пользователь не найден');

    user.archive();
    return this.repo.save(user);
  }

  async findAdmin() {
    const admin = await this.repo.findAdmin();
    if (!admin) {
      throw new NotFoundException(
        'Администратор не найден. Пожалуйста, назначьте роль admin и привяжите Google аккаунт.',
      );
    }
    return admin;
  }

  async findAllForSync() {
    return this.repo.findAllWithGoogle();
  }

  async create(dto: NewUserDto) {
    let passwordHash = '';
    if (dto.email) {
      const cleanEmail = dto.email.toLowerCase().trim();
      passwordHash = await bcrypt.hash(cleanEmail, 10);
    }

    const user = User.create({
      firstName: dto.firstName || 'New',
      lastName: dto.lastName || 'User',
      email: dto.email,
      tgId: dto.tgId,
      username: dto.username,
      registrationStep: dto.registrationStep,
      status: dto.status
        ? UserStatus.fromString(dto.status)
        : UserStatus.ACTIVE,
      password: passwordHash,
    });
    return this.repo.save(user);
  }

  // В UserService
  // ... внутри UserService

  async syncTelegramUser(dto: any) {
    const { tgId, email, registrationStep, firstName, lastName, username } =
      dto;

    const currentUser = await this.repo.findByTgId(tgId);

    if (email) {
      const existingUserByEmail = await this.repo.findByEmail(
        email.toLowerCase().trim(),
      );

      if (existingUserByEmail) {
        // КЕЙС: Пользователь с таким Email уже есть

        // Сравниваем ID. Так как id — это Value Object, используем .toString() или .value
        if (
          !currentUser ||
          existingUserByEmail.id.toString() !== currentUser.id.toString()
        ) {
          existingUserByEmail.updateDetails({
            tgId: tgId,
            username: username || existingUserByEmail.username,
            firstName: firstName || existingUserByEmail.firstName,
            lastName: lastName || existingUserByEmail.lastName,
            registrationStep: 'completed',
          });

          existingUserByEmail.activate();

          // Удаляем временного пользователя
          if (currentUser) {
            // ИСПРАВЛЕНО: передаем строку, а не объект UserID
            await this.repo.delete(currentUser.id.toString());
          }

          return this.repo.save(existingUserByEmail);
        }
      }
    }

    if (currentUser) {
      currentUser.updateDetails(dto);
      return this.repo.save(currentUser);
    } else {
      return this.create(dto);
    }
  }

  async changePassword(dto: ChangePasswordDto) {
    const user = await this.repo.findById(dto.userId);
    if (!user) throw new NotFoundException('Пользователь не найден');

    if (!user.password) {
      throw new BadRequestException(
        'У пользователя не установлен пароль (возможно, вход через Google)',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный текущий пароль');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.newPassword, saltRounds);
    user.setPassword(passwordHash);

    return this.repo.save(user);
  }

  async delete(id: string) {
    await this.repo.delete(id);
  }

  // В UserService
async generateResetCode(email: string) {
  const user = await this.repo.findByEmail(email.toLowerCase().trim());
  if (!user) throw new NotFoundException('Пользователь с таким Email не найден');
  if (!user.tgId) throw new BadRequestException('Аккаунт не привязан к Telegram. Обратитесь в поддержку.');

  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 знаков
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

  user.setResetCode(code, expires);
  await this.repo.save(user);

  return { code, tgId: user.tgId };
}

async resetPasswordWithCode(dto: ResetPasswordDto) {
  const user = await this.repo.findByEmail(dto.email.toLowerCase().trim());
  if (!user) throw new NotFoundException('Пользователь не найден');

  const savedCode = user.metadata.resetCode;
  const expires = user.metadata.resetCodeExpires ? new Date(user.metadata.resetCodeExpires as string) : null;

  if (!savedCode || savedCode !== dto.code || !expires || expires < new Date()) {
    throw new BadRequestException('Неверный или просроченный код');
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(dto.newPassword, saltRounds);
  user.setPassword(passwordHash);
  user.clearResetCode();

  await this.repo.save(user);
}

}
