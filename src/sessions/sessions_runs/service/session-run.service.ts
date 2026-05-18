import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSessionRunDto } from '../dto/create-session-run.dto';
import { UpdateSessionRunDto } from '../dto/update-session-run.dto';

@Injectable()
export class SessionRunService {
  private readonly currentOrgId: string;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.currentOrgId = this.request.currentOrgId as string;
  }

  async create(dto: CreateSessionRunDto) {
    return this.prisma.sessionRun.create({
      data: { ...dto, organizationId: this.currentOrgId },
      include: { level: true, academicYear: true, subjects: true },
    });
  }

  async findAll() {
    return this.prisma.sessionRun.findMany({
      where: { organizationId: this.currentOrgId },
      include: {
        level: true,
        academicYear: true,
        subjects: true,
      },
    });
  }

  async findOne(id: string) {
    const run = await this.prisma.sessionRun.findUnique({
      where: { id, organizationId: this.currentOrgId },
      include: { level: true, academicYear: true, subjects: true },
    });
    if (!run) throw new NotFoundException(`SessionRun with ID ${id} not found`);
    return run;
  }

  async update(id: string, dto: UpdateSessionRunDto) {
    await this.findOne(id);
    return this.prisma.sessionRun.update({
      where: { id, organizationId: this.currentOrgId },
      data: dto,
      include: { level: true, academicYear: true, subjects: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.sessionRun.delete({
      where: { id, organizationId: this.currentOrgId },
    });
  }
}
