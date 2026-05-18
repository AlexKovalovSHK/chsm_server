import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IStudentRepository } from '../../domain/repositories/student.repository.interface';
import { Student } from '../../domain/entities/student.entity';
import { StudentMapper } from '../mappers/student.mapper';

@Injectable()
export class PrismaStudentRepository implements IStudentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(student: Student, organizationId: string): Promise<Student> {
    const data = StudentMapper.toPersistence(student);
    const created = await this.prisma.student.create({
      data: { ...data, organizationId },
    });
    return StudentMapper.toDomain(created);
  }

  async findAll(organizationId: string): Promise<Student[]> {
    const students = await this.prisma.student.findMany({
      where: { organizationId },
    });
    return students.map((prismaStudent) =>
      StudentMapper.toDomain(prismaStudent),
    );
  }

  async findById(id: string, organizationId: string): Promise<Student | null> {
    const student = await this.prisma.student.findUnique({
      where: { id, organizationId },
    });

    if (!student) {
      return null;
    }

    return StudentMapper.toDomain(student);
  }

  async findByUserId(
    userId: string,
    organizationId: string,
  ): Promise<Student | null> {
    const student = await this.prisma.student.findFirst({
      where: { userId, organizationId },
    });

    if (!student) {
      return null;
    }

    return StudentMapper.toDomain(student);
  }

  async update(student: Student, organizationId: string): Promise<Student> {
    const data = StudentMapper.toPersistence(student);
    const updated = await this.prisma.student.update({
      where: { id: student.id, organizationId },
      data,
    });

    return StudentMapper.toDomain(updated);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    await this.prisma.student.delete({
      where: { id, organizationId },
    });
  }

  async getStudentWithFullRelations(
    id: string,
    organizationId: string,
  ): Promise<any> {
    return this.prisma.student.findUnique({
      where: { id, organizationId },
      include: {
        enrollments: {
          include: {
            sessionRun: {
              include: {
                academicYear: true,
                level: true,
                subjects: {
                  include: {
                    level: true,
                  },
                },
              },
            },
            gradeEntries: true,
          },
        },
      },
    });
  }
}
