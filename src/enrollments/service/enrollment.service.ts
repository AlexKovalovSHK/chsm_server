import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEnrollmentDto } from '../dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from '../dto/update-enrollment.dto';
import { ApprovedEnrollment } from '../dto/apruve-enrollment.dto';
import { EnrollmentDto } from '../dto/enrollment.dto';
import { EnrollmentMapper } from '../mappers/enrollment.mapper';

@Injectable()
export class EnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEnrollmentDto): Promise<EnrollmentDto> {
    const enrollment = await this.prisma.enrollment.create({
      data: {
        ...dto,
        enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : undefined,
        approvedAt: dto.approvedAt ? new Date(dto.approvedAt) : undefined,
      },
      include: { student: true, sessionRun: true },
    });
    return EnrollmentMapper.toDto(enrollment);
  }

  async findAll(): Promise<EnrollmentDto[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      include: { student: true, sessionRun: true },
    });
    return enrollments.map(EnrollmentMapper.toDto);
  }

  async findAllByStudentId(id: string): Promise<EnrollmentDto[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId: id },
      include: { student: true, sessionRun: true },
    });
    return enrollments.map(EnrollmentMapper.toDto);
  }

  async findOne(id: string): Promise<EnrollmentDto> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: { student: true, sessionRun: true },
    });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }
    return EnrollmentMapper.toDto(enrollment);
  }

  async update(id: string, dto: UpdateEnrollmentDto): Promise<EnrollmentDto> {
    await this.findOne(id);
    const enrollment = await this.prisma.enrollment.update({
      where: { id },
      data: {
        ...dto,
        enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : undefined,
        approvedAt: dto.approvedAt ? new Date(dto.approvedAt) : undefined,
      },
      include: { student: true, sessionRun: true },
    });
    return EnrollmentMapper.toDto(enrollment);
  }

  async approve(id: string, dto: ApprovedEnrollment): Promise<EnrollmentDto> {
    await this.findOne(id);
    const enrollment = await this.prisma.enrollment.update({
      where: { id },
      data: {
        approvedAt: new Date(),
        approvedBy: dto.approvedBy,
      },
      include: { student: true, sessionRun: true },
    });
    return EnrollmentMapper.toDto(enrollment);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.enrollment.delete({
      where: { id },
    });
  }
}
