import { User } from '../domain/user.entity';
import { UserDocument } from './user.document';
import { UserID } from '../domain/value-objects/user-id.vo';
import { UserStatus } from '../domain/value-objects/user-status.vo';
import { UserRole } from '../domain/value-objects/user-role.vo';
import { UserResponseDto } from '../application/dto/user-response.dto';

export class UserMapper {
  static toDomain(doc: UserDocument): User {
    return User.reconstitute({
      id: UserID.fromString(doc._id.toString()),
      firstName: doc.firstName,
      lastName: doc.lastName,
      username: doc.username,
      tel: doc.tel,
      photoUrl: doc.photoUrl,
      email: doc.email,
      tgId: doc.tgId,
      role: UserRole.fromString(doc.role),
      status: UserStatus.fromString(doc.status),
      courses: doc.courses,
      lastSeenTaskIds: doc.lastSeenTaskIds,
      xp: doc.xp,
      level: doc.level,
      googleTokens: doc.googleTokens,
      languageCode: doc.languageCode,
      registrationStep: doc.registrationStep,
      isVerified: doc.isVerified,
      isPremium: doc.isPremium,
      platformId: doc.platformId,
      metadata: doc.metadata,
      _sourceUser: doc._sourceUser,
      _sourceTg: doc._sourceTg,
      _mergedAt: doc._mergedAt,
      password: doc.password,
      googleId: doc.googleId,
    });
  }

  static toPersistence(user: User): Partial<UserDocument> {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      tel: user.tel,
      photoUrl: user.photoUrl,
      email: user.email,
      tgId: user.tgId,
      role: user.role.toString(),
      status: user.status.toString(),
      courses: user.courses,
      lastSeenTaskIds: user.lastSeenTaskIds,
      xp: user.xp,
      level: user.level,
      googleTokens: user.googleTokens,
      languageCode: user.languageCode,
      registrationStep: user.registrationStep,
      isVerified: user.isVerified,
      isPremium: user.isPremium,
      platformId: user.platformId,
      metadata: user.metadata,
      _sourceUser: user._sourceUser,
      _sourceTg: user._sourceTg,
      _mergedAt: user._mergedAt,
      password: user.password,
      googleId: user.googleId,
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
      googleId: user.googleId,
      xp: user.xp,
      level: user.level,
      registrationStep: user.registrationStep,
      isVerified: user.isVerified,
      isPremium: user.isPremium,
      metadata: user.metadata,
    };
  }
}
