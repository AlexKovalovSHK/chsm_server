import { Organization as PrismaOrganization } from '@prisma/client';
import { OrganizationResponseDto } from '../dto/organization-response.dto';

export class OrganizationMapper {
  static toResponseDto(
    org: PrismaOrganization,
    membersCount?: number,
  ): OrganizationResponseDto {
    return {
      id: org.id,
      slug: org.slug,
      name: org.name,
      domain: org.domain ?? null,
      googleWorkspaceId: org.googleWorkspaceId ?? null,
      plan: org.plan,
      settings: org.settings as Record<string, any>,
      createdAt: org.createdAt,
      ...(membersCount !== undefined && { membersCount }),
    };
  }

  static toResponseDtoList(orgs: PrismaOrganization[]): OrganizationResponseDto[] {
    return orgs.map((org) => OrganizationMapper.toResponseDto(org));
  }
}
