import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { UserRole } from '../domain/value-objects/user-role.vo';
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

  async update(id: string, updateData: any) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('Пользователь не найден');
    user.patch(updateData);
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
    tgId: string,
    email: string,
    tokens: any,
    profile?: any,
  ) {
    let user = await this.repo.findByTgId(tgId);
    
    if (!user) {
      user = User.create({
        firstName: profile?.given_name || '',
        lastName: profile?.family_name || '',
        tgId,
      });
    }

    user.linkGoogle(email, tokens, profile);
    return this.repo.save(user);
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
