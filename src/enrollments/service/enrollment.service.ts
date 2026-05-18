import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEnrollmentDto } from '../dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from '../dto/update-enrollment.dto';
import { ApprovedEnrollment } from '../dto/apruve-enrollment.dto';
import { EnrollmentDto } from '../dto/enrollment.dto';
import { EnrollmentMapper } from '../mappers/enrollment.mapper';

@Injectable()
export class EnrollmentService {
  private readonly currentOrgId: string;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.currentOrgId = this.request.currentOrgId as string;
  }

  async create(dto: CreateEnrollmentDto): Promise<EnrollmentDto> {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId, organizationId: this.currentOrgId },
    });
    if (!student) {
      throw new ForbiddenException(
        'Student not found or belongs to another organization',
      );
    }

    const sessionRun = await this.prisma.sessionRun.findUnique({
      where: { id: dto.sessionRunId, organizationId: this.currentOrgId },
    });
    if (!sessionRun) {
      throw new ForbiddenException(
        'SessionRun not found or belongs to another organization',
      );
    }

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
      where: {
        student: { organizationId: this.currentOrgId },
      },
      include: { student: true, sessionRun: true },
    });
    return enrollments.map(EnrollmentMapper.toDto);
  }

  async findAllByStudentId(id: string): Promise<EnrollmentDto[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: id,
        student: { organizationId: this.currentOrgId },
      },
      include: { student: true, sessionRun: true },
    });
    return enrollments.map(EnrollmentMapper.toDto);
  }

  async findOne(id: string): Promise<EnrollmentDto> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        id,
        student: { organizationId: this.currentOrgId },
      },
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
