import { User } from '../domain/user.entity';
import { UserID } from '../domain/value-objects/user-id.vo';
import { UserStatus } from '../domain/value-objects/user-status.vo';
import { UserRole } from '../domain/value-objects/user-role.vo';
import { User as PrismaUser, Prisma } from '@prisma/client';
import { UserResponseDto } from '../application/dto/user-response.dto';

export class UserMapper {
  static toDomain(doc: PrismaUser): User {
    // We use mongoId as the domain id string representation, 
    // or fallback to the auto-incremented id as string if missing (for legacy or test reasons)
    const domainIdStr = doc.mongoId || doc.id.toString();
    
    return User.reconstitute({
      id: UserID.fromString(domainIdStr),
      firstName: doc.firstName || '',
      lastName: doc.lastName || '',
      username: doc.username || undefined,
      tel: doc.tel || undefined,
      photoUrl: doc.photoUrl || undefined,
      email: doc.email || undefined,
      tgId: doc.tgId || undefined,
      role: UserRole.fromString(doc.role),
      status: UserStatus.fromString(doc.status),
      xp: doc.xp ?? 0,
      level: doc.level ?? 1,
      googleTokens: doc.googleTokens ? (doc.googleTokens as any) : undefined,
      languageCode: doc.languageCode || undefined,
      registrationStep: doc.registrationStep,
      isVerified: doc.isVerified,
      isPremium: doc.isPremium,
      platformId: doc.platformId || undefined,
      metadata: doc.metadata ? (doc.metadata as Record<string, unknown>) : {},
      _sourceUser: doc.sourceUser || undefined,
      _sourceTg: doc.sourceTg || undefined,
      _mergedAt: doc.mergedAt || undefined,
      password: doc.password || undefined,
      googleId: doc.googleId || undefined,
    });
  }

  static toPersistence(user: User): Omit<Prisma.UserCreateInput, 'id' | 'createdAt' | 'updatedAt' | 'mongoId'> {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username || null,
      tel: user.tel || null,
      photoUrl: user.photoUrl || null,
      email: user.email || null,
      tgId: user.tgId || null,
      role: user.role.toString(),
      status: user.status.toString(),
      xp: user.xp,
      level: user.level,
      googleTokens: user.googleTokens ? (user.googleTokens as Prisma.InputJsonValue) : Prisma.JsonNull,
      languageCode: user.languageCode || null,
      registrationStep: user.registrationStep,
      isVerified: user.isVerified,
      isPremium: user.isPremium,
      platformId: user.platformId || null,
      metadata: user.metadata as Prisma.InputJsonValue,
      sourceUser: user._sourceUser || null,
      sourceTg: user._sourceTg || null,
      mergedAt: user._mergedAt || null,
      password: user.password || null,
      googleId: user.googleId || null,
    };
  }

  static toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      tel: user.tel,
      photoUrl: user.photoUrl,
      email: user.email,
      tgId: user.tgId,
      role: user.role.toString(),
      status: user.status.toString(),
      xp: user.xp,
      level: user.level,
      googleId: user.googleId,
      registrationStep: user.registrationStep,
      isVerified: user.isVerified,
      isPremium: user.isPremium,
      metadata: user.metadata,
    };
  }
}

