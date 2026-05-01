import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { UserRole } from '../domain/value-objects/user-role.vo';
import { UpdateUserDto } from './dto/update-user.dto';
import * as userRepositoryInterface from '../domain/user.repository.interface';

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository') private readonly repo: userRepositoryInterface.IUserRepository,
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
    return this.repo.findByTgId(tgId);
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

 async saveGoogleTokens(state: string, googleEmail: string, tokens: any, profile: any) {
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

}
