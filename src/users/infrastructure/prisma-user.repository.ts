import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../domain/user.entity';
import { IUserRepository, UserFilter } from '../domain/user.repository.interface';
import { UserMapper } from './user.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const doc = await this.prisma.user.findFirst({
      where: { mongoId: id },
    });
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async findByTgId(tgId: string): Promise<User | null> {
    const doc = await this.prisma.user.findFirst({
      where: { tgId },
    });
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.prisma.user.findFirst({
      where: { email },
    });
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async findAll(filter: UserFilter): Promise<User[]> {
    const where: Prisma.UserWhereInput = {};

    if (filter.search) {
      where.OR = [
        { firstName: { contains: filter.search, mode: 'insensitive' } },
        { lastName: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.status) {
      where.status = filter.status;
    } else {
      where.status = { not: 'archived' };
    }

    if (filter.role) {
      where.role = filter.role;
    }

    const docs = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    return docs.map((doc) => UserMapper.toDomain(doc));
  }

  async findAdmin(): Promise<User | null> {
    const doc = await this.prisma.user.findFirst({
      where: {
        role: 'admin',
        googleTokens: { not: Prisma.JsonNull },
      },
    });
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async findAllWithGoogle(): Promise<User[]> {
    const docs = await this.prisma.user.findMany({
      where: {
        googleTokens: { not: Prisma.JsonNull },
        status: 'active',
      },
    });
    return docs.map((doc) => UserMapper.toDomain(doc));
  }

  async save(user: User): Promise<User> {
    const persistence = UserMapper.toPersistence(user);
    console.log(`💾 Saving user ${user.id.toString()}:`, JSON.stringify(persistence, null, 2));
    
    const mongoId = user.id.toString();

    const doc = await this.prisma.user.upsert({
      where: { mongoId },
      update: {
        ...persistence,
        updatedAt: new Date(),
      },
      create: {
        ...persistence,
        mongoId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return UserMapper.toDomain(doc);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const doc = await this.prisma.user.findFirst({
      where: { googleId },
    });
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.deleteMany({
      where: { mongoId: id },
    });
  }
}
