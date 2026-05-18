import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSessionRunDto } from '../dto/create-session-run.dto';
import { UpdateSessionRunDto } from '../dto/update-session-run.dto';

@Injectable()
export class SessionRunService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSessionRunDto, organizationId: string) {
    return this.prisma.sessionRun.create({
      data: { ...dto, organizationId },
      include: { level: true, academicYear: true, subjects: true },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.sessionRun.findMany({
      where: { organizationId },
      include: { level: true, academicYear: true, subjects: true },
    });
  }

  async findOne(id: string, organizationId: string) {
    const run = await this.prisma.sessionRun.findUnique({
      where: { id, organizationId },
      include: { level: true, academicYear: true, subjects: true },
    });
    if (!run) throw new NotFoundException(`SessionRun with ID ${id} not found`);
    return run;
  }

  async update(id: string, dto: UpdateSessionRunDto, organizationId: string) {
    const run = await this.prisma.sessionRun.findUnique({
      where: { id, organizationId },
    });
    if (!run) throw new NotFoundException(`SessionRun with ID ${id} not found`);
    return this.prisma.sessionRun.update({
      where: { id, organizationId },
      data: dto,
      include: { level: true, academicYear: true, subjects: true },
    });
  }

  async remove(id: string, organizationId: string) {
    const run = await this.prisma.sessionRun.findUnique({
      where: { id, organizationId },
    });
    if (!run) throw new NotFoundException(`SessionRun with ID ${id} not found`);
    return this.prisma.sessionRun.delete({
      where: { id, organizationId },
    });
  }
}
