import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSessionRunDto } from '../dto/create-session-run.dto';
import { UpdateSessionRunDto } from '../dto/update-session-run.dto';

@Injectable()
export class SessionRunService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSessionRunDto) {
    return this.prisma.sessionRun.create({
      data: dto,
      include: { level: true, academicYear: true, subjects: true },
    });
  }

  async findAll() {
    return this.prisma.sessionRun.findMany({
      include: {
        level: true,
        academicYear: true,
        subjects: true,
      },
    });
  }

  async findOne(id: string) {
    const run = await this.prisma.sessionRun.findUnique({
      where: { id },
      include: { level: true, academicYear: true, subjects: true },
    });
    if (!run) throw new NotFoundException(`SessionRun with ID ${id} not found`);
    return run;
  }

  async update(id: string, dto: UpdateSessionRunDto) {
    await this.findOne(id);
    return this.prisma.sessionRun.update({
      where: { id },
      data: dto,
      include: { level: true, academicYear: true, subjects: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.sessionRun.delete({ where: { id } });
  }
}
