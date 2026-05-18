import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationListQueryDto,
  OrganizationResponseDto,
  OrgMemberResponseDto,
  AddUserToOrgDto,
  UpdateUserRoleDto,
} from './dto';

@Controller('admin/organizations')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  // ── Organization CRUD ──

  @Post()
  async create(
    @Body() dto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.orgService.create(dto);
  }

  @Get()
  async findAll(
    @Query() query: OrganizationListQueryDto,
  ): Promise<OrganizationResponseDto[]> {
    return this.orgService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<OrganizationResponseDto> {
    return this.orgService.findById(id);
  }

  @Get('by-slug/:slug')
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<OrganizationResponseDto> {
    return this.orgService.findBySlug(slug);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.orgService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.orgService.delete(id);
  }

  // ── Members management ──

  @Post(':id/members')
  async addUserToOrg(
    @Param('id') orgId: string,
    @Body() dto: AddUserToOrgDto,
  ): Promise<OrgMemberResponseDto> {
    return this.orgService.addUserToOrg(orgId, dto);
  }

  @Get(':id/members')
  async getOrgMembers(
    @Param('id') orgId: string,
  ): Promise<OrgMemberResponseDto[]> {
    return this.orgService.getOrgMembers(orgId);
  }

  @Patch(':id/members/:userId/role')
  async updateUserRoleInOrg(
    @Param('id') orgId: string,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<OrgMemberResponseDto> {
    return this.orgService.updateUserRoleInOrg(orgId, userId, dto);
  }

  @Delete(':id/members/:userId')
  async removeUserFromOrg(
    @Param('id') orgId: string,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<void> {
    return this.orgService.removeUserFromOrg(orgId, userId);
  }
}
