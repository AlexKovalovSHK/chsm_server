import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Organization, OrgMember, OrgMemberRole, Prisma } from '@prisma/client';
import { IOrganizationRepository } from '../interfaces/organization.repository.interface';

@Injectable()
export class PrismaOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Organization CRUD ──

  async create(data: {
    slug: string;
    name: string;
    domain?: string;
    googleWorkspaceId?: string;
    plan?: string;
    settings?: any;
  }): Promise<Organization> {
    return this.prisma.organization.create({ data });
  }

  async findById(id: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { slug } });
  }

  async findAll(query?: {
    search?: string;
    plan?: string;
    limit?: number;
    offset?: number;
  }): Promise<Organization[]> {
    const where: Prisma.OrganizationWhereInput = {};

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.plan) {
      where.plan = query.plan;
    }

    return this.prisma.organization.findMany({
      where,
      take: query?.limit,
      skip: query?.offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
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
  ): Promise<Organization> {
    return this.prisma.organization.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.organization.delete({ where: { id } });
  }

  // ── OrgMember management ──

  async addMember(
    orgId: string,
    userId: number,
    role: OrgMemberRole,
  ): Promise<OrgMember & { user?: any }> {
    return this.prisma.orgMember.create({
      data: {
        organizationId: orgId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            mongoId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findMember(
    orgId: string,
    userId: number,
  ): Promise<OrgMember | null> {
    return this.prisma.orgMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });
  }

  async updateMemberRole(
    orgId: string,
    userId: number,
    role: OrgMemberRole,
  ): Promise<OrgMember & { user?: any }> {
    return this.prisma.orgMember.update({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            mongoId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async removeMember(orgId: string, userId: number): Promise<void> {
    await this.prisma.orgMember.delete({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });
  }

  async getMembers(
    orgId: string,
  ): Promise<(OrgMember & { user?: any })[]> {
    return this.prisma.orgMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            mongoId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMembersCount(orgId: string): Promise<number> {
    return this.prisma.orgMember.count({
      where: { organizationId: orgId },
    });
  }
}
