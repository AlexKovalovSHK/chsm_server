import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';

@Injectable()
export class SubjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubjectDto, organizationId: string) {
    // verify sessionRun belongs to currentOrgId
    const sessionRun = await this.prisma.sessionRun.findUnique({
      where: { id: dto.sessionRunId, organizationId },
    });
    if (!sessionRun) {
      throw new ForbiddenException(
        'Invalid session run or not in this organization',
      );
    }

    // Убираем поля, которых нет в Prisma Subject (teacherName и т.п.)
    const { teacherName, ...cleanData } = dto as any;

    return this.prisma.subject.create({
      data: cleanData,
      include: { level: true, sessionRun: true },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.subject.findMany({
      where: {
        sessionRun: {
          organizationId,
        },
      },
      include: { level: true, sessionRun: true },
    });
  }

  async findOne(id: string, organizationId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: {
        id,
        sessionRun: {
          organizationId,
        },
      },
      include: { level: true, sessionRun: true },
    });
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    return subject;
  }

  async update(id: string, dto: UpdateSubjectDto, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.subject.update({
      where: { id },
      data: dto,
      include: { level: true, sessionRun: true },
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.subject.delete({
      where: { id },
    });
  }
}
