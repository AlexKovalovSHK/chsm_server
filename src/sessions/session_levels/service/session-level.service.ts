import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSessionLevelDto } from '../dto/create-session-level.dto';
import { UpdateSessionLevelDto } from '../dto/update-session-level.dto';

@Injectable()
export class SessionLevelService {
  private readonly currentOrgId: string;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.currentOrgId = this.request.currentOrgId as string;
  }

  async create(dto: CreateSessionLevelDto) {
    return this.prisma.sessionLevel.create({
      data: { ...dto, organizationId: this.currentOrgId },
    });
  }

  async findAll() {
    return this.prisma.sessionLevel.findMany({
      where: { organizationId: this.currentOrgId },
      orderBy: { number: 'asc' },
    });
  }

  async findOne(id: string) {
    const level = await this.prisma.sessionLevel.findUnique({
      where: { id, organizationId: this.currentOrgId },
    });
    if (!level) throw new NotFoundException(`Level with ID ${id} not found`);
    return level;
  }

  async update(id: string, dto: UpdateSessionLevelDto) {
    await this.findOne(id);
    return this.prisma.sessionLevel.update({
      where: { id, organizationId: this.currentOrgId },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.sessionLevel.delete({
      where: { id, organizationId: this.currentOrgId },
    });
  }
}
