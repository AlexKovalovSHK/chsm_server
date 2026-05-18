import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../domain/user.entity';
import {
  IUserRepository,
  UserFilter,
} from '../domain/user.repository.interface';
import { UserMapper } from './user.mapper';
import { OrganizationService } from '../../organization/organization.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  private readonly logger = new Logger(PrismaUserRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orgService: OrganizationService,
  ) {}

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

  async save(user: User, organizationId?: string): Promise<User> {
    const persistence = UserMapper.toPersistence(user);

    const mongoId = user.id.toString();
    const email = persistence.email;

    // Защита от дубликатов email
    if (email) {
      const existingByEmail = await this.prisma.user.findFirst({
        where: {
          email,
          mongoId: { not: mongoId },
        },
      });

      if (existingByEmail) {
        throw new ConflictException(
          `Пользователь с email «${email}» уже существует (ID: ${existingByEmail.id})`,
        );
      }
    }

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

    // Создаём OrgMember через OrganizationService (если ещё нет)
    try {
      const org = organizationId
        ? await this.orgService.findById(organizationId)
        : await this.orgService.getDefaultOrganization();

      // Маппим UserRole → OrgMemberRole
      // 'student' → 'STUDENT', 'admin' → 'ADMIN', 'teacher' → 'TEACHER'
      const orgRole = user.role.toString().toUpperCase() as any;

      await this.orgService.addUserToOrg(org.id, {
        userId: doc.id,
        role: orgRole,
      });
    } catch (err) {
      // ConflictException = уже участник — это нормально для upsert-логики
      if (!(err instanceof ConflictException)) {
        this.logger.warn(`OrgMember creation skipped: ${err.message}`);
      }
    }

    return UserMapper.toDomain(doc);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const doc = await this.prisma.user.findFirst({
      where: { googleId },
    });
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<void> {
    // Сначала удаляем связанный Student (каскадно удалит Enrollment, Practice и т.д.)
    await this.prisma.student.deleteMany({
      where: { userId: id },
    });

    // Теперь удаляем пользователя
    await this.prisma.user.deleteMany({
      where: { mongoId: id },
    });
  }
}
