import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GradeIService } from '../grade.interface';
import { GradeEntry } from '@prisma/client';
import { CreateGradeDto } from '../dto/create-grade.dto';
import { UpdateGradeDto } from '../dto/update-grade.dto';

@Injectable()
export class GradeService implements GradeIService {
  constructor(private prisma: PrismaService) {}

  async createGrade(data: CreateGradeDto): Promise<GradeEntry> {
    return this.prisma.gradeEntry.create({ data });
  }

  async findAllGrades(): Promise<GradeEntry[]> {
    return this.prisma.gradeEntry.findMany({
      include: { subject: true },
    });
  }

  async findGradeById(id: string): Promise<GradeEntry | null> {
    const grade = await this.prisma.gradeEntry.findUnique({
      where: { id },
      include: { subject: true },
    });
    if (!grade) {
      throw new NotFoundException(`Grade with ID "${id}" not found`);
    }
    return grade;
  }

  async findGradesByEnrollmentId(enrollmentId: string): Promise<GradeEntry[]> {
    return this.prisma.gradeEntry.findMany({
      where: { enrollmentId },
      include: { subject: true },
    });
  }

  async findGradesBySubjectId(subjectId: string): Promise<GradeEntry[]> {
    return this.prisma.gradeEntry.findMany({
      where: { subjectId },
      include: { subject: true },
    });
  }

  async updateGrade(id: string, data: UpdateGradeDto): Promise<GradeEntry> {
    const grade = await this.prisma.gradeEntry.findUnique({
      where: { id },
    });

    if (!grade) {
      throw new NotFoundException(`Grade with ID "${id}" not found`);
    }

    return this.prisma.gradeEntry.update({
      where: { id },
      data,
      include: { subject: true },
    });
  }

  async deleteGrade(id: string): Promise<GradeEntry> {
    const grade = await this.prisma.gradeEntry.findUnique({
      where: { id },
    });

    if (!grade) {
      throw new NotFoundException(`Grade with ID "${id}" not found`);
    }

    return this.prisma.gradeEntry.delete({
      where: { id },
      include: { subject: true },
    });
  }
}
