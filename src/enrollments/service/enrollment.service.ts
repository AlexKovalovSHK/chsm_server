import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEnrollmentDto } from '../dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from '../dto/update-enrollment.dto';

@Injectable()
export class EnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEnrollmentDto) {
    return this.prisma.enrollment.create({
      data: {
        ...dto,
        enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : undefined,
      },
      include: { student: true, sessionRun: true },
    });
  }

  async findAll() {
    return this.prisma.enrollment.findMany({
      include: { student: true, sessionRun: true },
    });
  }

  async findAllByStudentId(id: string) {
    return this.prisma.enrollment.findMany({
      include: { student: true, sessionRun: true },
    });
  }

  async findOne(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: { student: true, sessionRun: true },
    });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }
    return enrollment;
  }

  async update(id: string, dto: UpdateEnrollmentDto) {
    await this.findOne(id);
    return this.prisma.enrollment.update({
      where: { id },
      data: {
        ...dto,
        enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : undefined,
      },
      include: { student: true, sessionRun: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.enrollment.delete({
      where: { id },
    });
  }
}
