import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGradeEntryDto } from '../dto/create-grade-entry.dto';
import { UpdateGradeEntryDto } from '../dto/update-grade-entry.dto';

@Injectable()
export class GradeEntryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGradeEntryDto) {
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
      include: { enrollment: true, subject: true },
    });
  }

  async findOne(id: string) {
    const entry = await this.prisma.gradeEntry.findUnique({
      where: { id },
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
