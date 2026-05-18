import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGradeEntryDto } from '../dto/create-grade-entry.dto';
import { UpdateGradeEntryDto } from '../dto/update-grade-entry.dto';

@Injectable()
export class GradeEntryService {
  private readonly currentOrgId: string;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.currentOrgId = this.request.currentOrgId as string;
  }

  async create(dto: CreateGradeEntryDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        id: dto.enrollmentId,
        student: { organizationId: this.currentOrgId },
      },
    });
    if (!enrollment) {
      throw new ForbiddenException(
        'Enrollment not found or belongs to another organization',
      );
    }

    const subject = await this.prisma.subject.findUnique({
      where: {
        id: dto.subjectId,
        sessionRun: { organizationId: this.currentOrgId },
      },
    });
    if (!subject) {
      throw new ForbiddenException(
        'Subject not found or belongs to another organization',
      );
    }

    return this.prisma.gradeEntry.create({
      data: {
        ...dto,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : undefined,
      },
      include: { enrollment: true, subject: true },
    });
  }

  async findAll() {
    return this.prisma.gradeEntry.findMany({
      where: {
        enrollment: {
          student: { organizationId: this.currentOrgId },
        },
      },
      include: { enrollment: true, subject: true },
    });
  }

  async findOne(id: string) {
    const entry = await this.prisma.gradeEntry.findFirst({
      where: {
        id,
        enrollment: {
          student: { organizationId: this.currentOrgId },
        },
      },
      include: { enrollment: true, subject: true },
    });
    if (!entry) {
      throw new NotFoundException(`GradeEntry with ID ${id} not found`);
    }
    return entry;
  }

  async update(id: string, dto: UpdateGradeEntryDto) {
    await this.findOne(id);
    return this.prisma.gradeEntry.update({
      where: { id },
      data: {
        ...dto,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : undefined,
      },
      include: { enrollment: true, subject: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.gradeEntry.delete({
      where: { id },
    });
  }
}
