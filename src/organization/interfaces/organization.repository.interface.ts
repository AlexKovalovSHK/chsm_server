import { Organization, OrgMember, OrgMemberRole } from '@prisma/client';

export interface IOrganizationRepository {
  // ── Organization CRUD ──
  create(data: {
    slug: string;
    name: string;
    domain?: string;
    googleWorkspaceId?: string;
    plan?: string;
    settings?: any;
  }): Promise<Organization>;

  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;

  findAll(query?: {
    search?: string;
    plan?: string;
    limit?: number;
    offset?: number;
  }): Promise<Organization[]>;

  update(
    id: string,
    data: Partial<{
      name: string;
      domain: string;
      googleWorkspaceId: string;
      classroomConfig: any;
      telegramBotToken: string;
      plan: string;
      settings: any;
    }>,
  ): Promise<Organization>;

  delete(id: string): Promise<void>;

  // ── OrgMember management ──
  addMember(
    orgId: string,
    userId: number,
    role: OrgMemberRole,
  ): Promise<OrgMember & { user?: any }>;

  findMember(orgId: string, userId: number): Promise<OrgMember | null>;

  updateMemberRole(
    orgId: string,
    userId: number,
    role: OrgMemberRole,
  ): Promise<OrgMember & { user?: any }>;

  removeMember(orgId: string, userId: number): Promise<void>;

  getMembers(orgId: string): Promise<(OrgMember & { user?: any })[]>;

  getMembersCount(orgId: string): Promise<number>;
}
