import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGradebookDto } from '../dto/create-gradebook.dto';
import { UpdateGradebookDto } from '../dto/update-gradebook.dto';

@Injectable()
export class GradebookService {
  private readonly currentOrgId: string;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.currentOrgId = this.request.currentOrgId as string;
  }

  async create(dto: CreateGradebookDto) {
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

    return this.prisma.gradebook.create({
      data: {
        ...dto,
        approvedAt: dto.approvedAt ? new Date(dto.approvedAt) : undefined,
      },
      include: { enrollment: true },
    });
  }

  async findAll() {
    return this.prisma.gradebook.findMany({
      where: {
        enrollment: {
          student: { organizationId: this.currentOrgId },
        },
      },
      include: { enrollment: true },
    });
  }

  async findOne(id: string) {
    const gradebook = await this.prisma.gradebook.findFirst({
      where: {
        id,
        enrollment: {
          student: { organizationId: this.currentOrgId },
        },
      },
      include: { enrollment: true },
    });
    if (!gradebook) {
      throw new NotFoundException(`Gradebook with ID ${id} not found`);
    }
    return gradebook;
  }

  async update(id: string, dto: UpdateGradebookDto) {
    await this.findOne(id);
    return this.prisma.gradebook.update({
      where: { id },
      data: {
        ...dto,
        approvedAt: dto.approvedAt ? new Date(dto.approvedAt) : undefined,
      },
      include: { enrollment: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.gradebook.delete({
      where: { id },
    });
  }
}
