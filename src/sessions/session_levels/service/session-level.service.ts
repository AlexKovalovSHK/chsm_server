import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSessionLevelDto } from '../dto/create-session-level.dto';
import { UpdateSessionLevelDto } from '../dto/update-session-level.dto';

@Injectable()
export class SessionLevelService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSessionLevelDto, organizationId: string) {
    return this.prisma.sessionLevel.create({
      data: { ...dto, organizationId },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.sessionLevel.findMany({
      where: { organizationId },
      orderBy: { number: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const level = await this.prisma.sessionLevel.findUnique({
      where: { id, organizationId },
    });
    if (!level) throw new NotFoundException(`Level with ID ${id} not found`);
    return level;
  }

  async update(id: string, dto: UpdateSessionLevelDto, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.sessionLevel.update({
      where: { id, organizationId },
      data: dto,
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.sessionLevel.delete({
      where: { id, organizationId },
    });
  }
}
