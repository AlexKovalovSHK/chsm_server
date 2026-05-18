import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAcademicYearDto } from '../dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from '../dto/update-academic-year.dto';

@Injectable()
export class AcademicYearService {
  private readonly currentOrgId: string;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.currentOrgId = this.request.currentOrgId as string;
  }

  async create(dto: CreateAcademicYearDto) {
    return this.prisma.academicYear.create({
      data: {
        label: dto.label,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        organizationId: this.currentOrgId,
      },
    });
  }

  async findAll() {
    return this.prisma.academicYear.findMany({
      where: { organizationId: this.currentOrgId },
      orderBy: {
        startsAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const year = await this.prisma.academicYear.findUnique({
      where: { id, organizationId: this.currentOrgId },
    });

    if (!year) {
      throw new NotFoundException(`AcademicYear with ID ${id} not found`);
    }

    return year;
  }

  async update(id: string, dto: UpdateAcademicYearDto) {
    await this.findOne(id);

    return this.prisma.academicYear.update({
      where: { id, organizationId: this.currentOrgId },
      data: {
        ...dto,
        ...(dto.startsAt && { startsAt: new Date(dto.startsAt) }),
        ...(dto.endsAt && { endsAt: new Date(dto.endsAt) }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.academicYear.delete({
      where: { id, organizationId: this.currentOrgId },
    });
  }

  async findCurrent() {
    const now = new Date();
    return this.prisma.academicYear.findFirst({
      where: {
        startsAt: { lte: now },
        endsAt: { gte: now },
        organizationId: this.currentOrgId,
      },
    });
  }
}
