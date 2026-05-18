import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationListQueryDto,
  OrganizationResponseDto,
  OrgMemberResponseDto,
  AddUserToOrgDto,
  UpdateUserRoleDto,
} from '../dto';

export const IOrganizationService = Symbol('IOrganizationService');

export interface IOrganizationService {
  // ── Organization CRUD ──
  create(dto: CreateOrganizationDto): Promise<OrganizationResponseDto>;
  findById(id: string): Promise<OrganizationResponseDto>;
  findBySlug(slug: string): Promise<OrganizationResponseDto>;
  findAll(query?: OrganizationListQueryDto): Promise<OrganizationResponseDto[]>;
  update(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto>;
  delete(id: string): Promise<void>;

  // ── Member management ──
  addUserToOrg(
    orgId: string,
    dto: AddUserToOrgDto,
  ): Promise<OrgMemberResponseDto>;
  updateUserRoleInOrg(
    orgId: string,
    userId: number,
    dto: UpdateUserRoleDto,
  ): Promise<OrgMemberResponseDto>;
  removeUserFromOrg(orgId: string, userId: number): Promise<void>;
  getOrgMembers(orgId: string): Promise<OrgMemberResponseDto[]>;
  getMember(
    orgId: string,
    userId: number,
  ): Promise<OrgMemberResponseDto | null>;

  // ── Query helpers (для других модулей) ──
  getDefaultOrganization(): Promise<OrganizationResponseDto>;
  isMember(orgId: string, userId: number): Promise<boolean>;
}
