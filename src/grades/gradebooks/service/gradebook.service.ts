import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGradebookDto } from '../dto/create-gradebook.dto';
import { UpdateGradebookDto } from '../dto/update-gradebook.dto';

@Injectable()
export class GradebookService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGradebookDto) {
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
      include: { enrollment: true },
    });
  }

  async findOne(id: string) {
    const gradebook = await this.prisma.gradebook.findUnique({
      where: { id },
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
