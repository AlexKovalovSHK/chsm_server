import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAcademicYearDto } from '../dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from '../dto/update-academic-year.dto';

@Injectable()
export class AcademicYearService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAcademicYearDto) {
    return this.prisma.academicYear.create({
      data: {
        label: dto.label,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
      },
    });
  }

  async findAll() {
    return this.prisma.academicYear.findMany({
      orderBy: {
        startsAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const year = await this.prisma.academicYear.findUnique({
      where: { id },
    });

    if (!year) {
      throw new NotFoundException(`AcademicYear with ID ${id} not found`);
    }

    return year;
  }

  async update(id: string, dto: UpdateAcademicYearDto) {
    await this.findOne(id);

    return this.prisma.academicYear.update({
      where: { id },
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
      where: { id },
    });
  }

  async findCurrent() {
    const now = new Date();
    return this.prisma.academicYear.findFirst({
      where: {
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
    });
  }
}