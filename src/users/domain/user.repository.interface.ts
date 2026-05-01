import { User } from './user.entity';

export interface UserFilter {
  search?: string;
  status?: string;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByTgId(tgId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(filter: UserFilter): Promise<User[]>;
  findAdmin(): Promise<User | null>;
  findAllWithGoogle(): Promise<User[]>;
  save(user: User): Promise<User>;
  findByGoogleId(googleId: string): Promise<User | null>;
}
