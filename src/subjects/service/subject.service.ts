import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';

@Injectable()
export class SubjectService {
  private readonly currentOrgId: string;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.currentOrgId = this.request.currentOrgId as string;
  }

  async create(dto: CreateSubjectDto) {
    // verify sessionRun belongs to currentOrgId
    const sessionRun = await this.prisma.sessionRun.findUnique({
      where: { id: dto.sessionRunId, organizationId: this.currentOrgId },
    });
    if (!sessionRun) {
      throw new ForbiddenException(
        'Invalid session run or not in this organization',
      );
    }

    return this.prisma.subject.create({
      data: dto,
      include: { level: true, sessionRun: true },
    });
  }

  async findAll() {
    return this.prisma.subject.findMany({
      where: {
        sessionRun: {
          organizationId: this.currentOrgId,
        },
      },
      include: { level: true, sessionRun: true },
    });
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findFirst({
      where: {
        id,
        sessionRun: {
          organizationId: this.currentOrgId,
        },
      },
      include: { level: true, sessionRun: true },
    });
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    return subject;
  }

  async update(id: string, dto: UpdateSubjectDto) {
    await this.findOne(id);
    return this.prisma.subject.update({
      where: { id },
      data: dto,
      include: { level: true, sessionRun: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.subject.delete({
      where: { id },
    });
  }
}
