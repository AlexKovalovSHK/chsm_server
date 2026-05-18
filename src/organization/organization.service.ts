import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  Logger,
} from '@nestjs/common';
import type { IOrganizationRepository } from './interfaces/organization.repository.interface';
import { OrganizationMapper } from './mappers/organization.mapper';
import { OrgMemberMapper } from './mappers/org-member.mapper';
import { OrgMemberRole } from '@prisma/client';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationListQueryDto,
  OrganizationResponseDto,
  OrgMemberResponseDto,
  AddUserToOrgDto,
  UpdateUserRoleDto,
} from './dto';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);
  private readonly defaultOrgSlug = 'chsm_brass_eu';

  constructor(
    @Inject('IOrganizationRepository')
    private readonly orgRepo: IOrganizationRepository,
  ) { }

  // ──────────────────────────────────────────────
  //  Organization CRUD
  // ──────────────────────────────────────────────

  async create(dto: CreateOrganizationDto): Promise<OrganizationResponseDto> {
    const existing = await this.orgRepo.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(
        `Organization with slug "${dto.slug}" already exists`,
      );
    }

    const org = await this.orgRepo.create({
      slug: dto.slug,
      name: dto.name,
      domain: dto.domain,
      googleWorkspaceId: dto.googleWorkspaceId,
      plan: dto.plan ?? 'free',
      settings: dto.settings ?? {},
    });

    return OrganizationMapper.toResponseDto(org);
  }

  async findById(id: string): Promise<OrganizationResponseDto> {
    const org = await this.orgRepo.findById(id);
    if (!org) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }
    return OrganizationMapper.toResponseDto(org);
  }

  async findBySlug(slug: string): Promise<OrganizationResponseDto> {
    const org = await this.orgRepo.findBySlug(slug);
    if (!org) {
      throw new NotFoundException(`Organization with slug "${slug}" not found`);
    }
    return OrganizationMapper.toResponseDto(org);
  }

  async findAll(
    query?: OrganizationListQueryDto,
  ): Promise<OrganizationResponseDto[]> {
    const orgs = await this.orgRepo.findAll({
      search: query?.search,
      plan: query?.plan,
      limit: query?.limit,
      offset: query?.offset,
    });
    return OrganizationMapper.toResponseDtoList(orgs);
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const existing = await this.orgRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

    const updated = await this.orgRepo.update(id, dto);
    return OrganizationMapper.toResponseDto(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.orgRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }
    await this.orgRepo.delete(id);
  }

  // ──────────────────────────────────────────────
  //  Member management
  // ──────────────────────────────────────────────

  async addUserToOrg(
    orgId: string,
    dto: AddUserToOrgDto,
  ): Promise<OrgMemberResponseDto> {
    const org = await this.orgRepo.findById(orgId);
    if (!org) {
      throw new NotFoundException(`Organization with ID "${orgId}" not found`);
    }

    const existingMember = await this.orgRepo.findMember(orgId, dto.userId);
    if (existingMember) {
      throw new ConflictException(
        `User ${dto.userId} is already a member of organization "${orgId}"`,
      );
    }

    const member = await this.orgRepo.addMember(
      orgId,
      dto.userId,
      dto.role as OrgMemberRole,
    );
    return OrgMemberMapper.toResponseDto(member);
  }

  async updateUserRoleInOrg(
    orgId: string,
    userId: number,
    dto: UpdateUserRoleDto,
  ): Promise<OrgMemberResponseDto> {
    const member = await this.orgRepo.findMember(orgId, userId);
    if (!member) {
      throw new NotFoundException(
        `User ${userId} is not a member of organization "${orgId}"`,
      );
    }

    const updated = await this.orgRepo.updateMemberRole(
      orgId,
      userId,
      dto.role as OrgMemberRole,
    );
    return OrgMemberMapper.toResponseDto(updated);
  }

  async removeUserFromOrg(orgId: string, userId: number): Promise<void> {
    const member = await this.orgRepo.findMember(orgId, userId);
    if (!member) {
      throw new NotFoundException(
        `User ${userId} is not a member of organization "${orgId}"`,
      );
    }
    await this.orgRepo.removeMember(orgId, userId);
  }

  /**
   * Upsert-метод: добавляет пользователя в организацию с ролью,
   * или обновляет роль, если уже участник.
   * Используется вместо связки addUserToOrg + updateUserRoleInOrg.
   */
  async ensureUserRoleInOrg(
    orgId: string,
    userId: number,
    role: string | OrgMemberRole,
  ): Promise<OrgMemberResponseDto> {
    // Тот самый "простой переключатель"
    const roleMapping: Record<string, OrgMemberRole> = {
      admin: OrgMemberRole.ADMIN,
      teacher: OrgMemberRole.TEACHER,
      student: OrgMemberRole.STUDENT,
      owner: OrgMemberRole.OWNER,
      viewer: OrgMemberRole.VIEWER,
    };

    const finalRole: OrgMemberRole =
      typeof role === 'string'
        ? roleMapping[role.toLowerCase()] || OrgMemberRole.STUDENT
        : role;

    // Проверяем существование организации
    const org = await this.orgRepo.findById(orgId);
    if (!org) {
      this.logger.error(
        `[ensureUserRoleInOrg] Organization ${orgId} NOT FOUND`,
      );
      throw new NotFoundException(`Organization with ID "${orgId}" not found`);
    }

    const existingMember = await this.orgRepo.findMember(orgId, userId);

    if (existingMember) {

      if (existingMember.role === finalRole) {
        return OrgMemberMapper.toResponseDto(existingMember);
      }

      const updated = await this.orgRepo.updateMemberRole(
        orgId,
        userId,
        finalRole,
      );

      return OrgMemberMapper.toResponseDto(updated);
    }

    const member = await this.orgRepo.addMember(orgId, userId, finalRole);

    return OrgMemberMapper.toResponseDto(member);
  }

  async getOrgMembers(orgId: string): Promise<OrgMemberResponseDto[]> {
    const org = await this.orgRepo.findById(orgId);
    if (!org) {
      throw new NotFoundException(`Organization with ID "${orgId}" not found`);
    }

    const members = await this.orgRepo.getMembers(orgId);
    return OrgMemberMapper.toResponseDtoList(members);
  }

  async getMember(
    orgId: string,
    userId: number,
  ): Promise<OrgMemberResponseDto | null> {
    const member = await this.orgRepo.findMember(orgId, userId);
    if (!member) return null;
    return OrgMemberMapper.toResponseDto(member);
  }

  // ──────────────────────────────────────────────
  //  Query helpers
  // ──────────────────────────────────────────────

  async getDefaultOrganization(): Promise<OrganizationResponseDto> {
    return this.findBySlug(this.defaultOrgSlug);
  }

  async isMember(orgId: string, userId: number): Promise<boolean> {
    const member = await this.orgRepo.findMember(orgId, userId);
    return member !== null;
  }
}
