import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { GradeIService } from '../grade.interface';
import { GradeEntry } from '@prisma/client';
import { CreateGradeDto } from '../dto/create-grade.dto';
import { UpdateGradeDto } from '../dto/update-grade.dto';

@Injectable()
export class GradeService implements GradeIService {
  private readonly currentOrgId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.currentOrgId = this.request.currentOrgId as string;
  }

  async createGrade(data: CreateGradeDto): Promise<GradeEntry> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        id: data.enrollmentId,
        student: { organizationId: this.currentOrgId },
      },
    });
    if (!enrollment) {
      throw new ForbiddenException(
        'Enrollment not found or belongs to another organization',
      );
    }

    const subject = await this.prisma.subject.findUnique({
      where: {
        id: data.subjectId,
        sessionRun: { organizationId: this.currentOrgId },
      },
    });
    if (!subject) {
      throw new ForbiddenException(
        'Subject not found or belongs to another organization',
      );
    }

    return this.prisma.gradeEntry.create({ data });
  }

  async findAllGrades(): Promise<GradeEntry[]> {
    return this.prisma.gradeEntry.findMany({
      where: {
        enrollment: {
          student: { organizationId: this.currentOrgId },
        },
      },
      include: { subject: true },
    });
  }

  async findGradeById(id: string): Promise<GradeEntry | null> {
    const grade = await this.prisma.gradeEntry.findFirst({
      where: {
        id,
        enrollment: {
          student: { organizationId: this.currentOrgId },
        },
      },
      include: { subject: true },
    });
    if (!grade) {
      throw new NotFoundException(`Grade with ID "${id}" not found`);
    }
    return grade;
  }

  async findGradesByEnrollmentId(enrollmentId: string): Promise<GradeEntry[]> {
    return this.prisma.gradeEntry.findMany({
      where: {
        enrollmentId,
        enrollment: {
          student: { organizationId: this.currentOrgId },
        },
      },
      include: { subject: true },
    });
  }

  async findGradesBySubjectId(subjectId: string): Promise<GradeEntry[]> {
    return this.prisma.gradeEntry.findMany({
      where: {
        subjectId,
        subject: {
          sessionRun: { organizationId: this.currentOrgId },
        },
      },
      include: { subject: true },
    });
  }

  async updateGrade(id: string, data: UpdateGradeDto): Promise<GradeEntry> {
    const grade = await this.findGradeById(id);

    return this.prisma.gradeEntry.update({
      where: { id },
      data,
      include: { subject: true },
    });
  }

  async deleteGrade(id: string): Promise<GradeEntry> {
    const grade = await this.findGradeById(id);

    return this.prisma.gradeEntry.delete({
      where: { id },
      include: { subject: true },
    });
  }
}
