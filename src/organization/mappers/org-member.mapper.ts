import { OrgMember as PrismaOrgMember } from '@prisma/client';
import { OrgMemberResponseDto } from '../dto/org-member-response.dto';

type OrgMemberWithUser = PrismaOrgMember & {
  user?: {
    id: number;
    mongoId: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
};

export class OrgMemberMapper {
  static toResponseDto(member: OrgMemberWithUser): OrgMemberResponseDto {
    return {
      id: member.id,
      organizationId: member.organizationId,
      userId: member.userId,
      userMongoId: member.user?.mongoId ?? '',
      userFirstName: member.user?.firstName ?? null,
      userLastName: member.user?.lastName ?? null,
      userEmail: member.user?.email ?? null,
      role: member.role as OrgMemberResponseDto['role'],
      createdAt: member.createdAt,
    };
  }

  static toResponseDtoList(members: OrgMemberWithUser[]): OrgMemberResponseDto[] {
    return members.map((m) => OrgMemberMapper.toResponseDto(m));
  }
}
