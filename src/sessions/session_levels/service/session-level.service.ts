import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSessionLevelDto } from '../dto/create-session-level.dto';
import { UpdateSessionLevelDto } from '../dto/update-session-level.dto';

@Injectable()
export class SessionLevelService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSessionLevelDto) {
    return this.prisma.sessionLevel.create({ data: dto });
  }

  async findAll() {
    return this.prisma.sessionLevel.findMany({
      orderBy: { number: 'asc' },
    });
  }

  async findOne(id: string) {
    const level = await this.prisma.sessionLevel.findUnique({ where: { id } });
    if (!level) throw new NotFoundException(`Level with ID ${id} not found`);
    return level;
  }

  async update(id: string, dto: UpdateSessionLevelDto) {
    await this.findOne(id);
    return this.prisma.sessionLevel.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.sessionLevel.delete({ where: { id } });
  }
}