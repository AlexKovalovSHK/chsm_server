import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IStudentRepository } from '../../domain/repositories/student.repository.interface';
import { Student } from '../../domain/entities/student.entity';
import { StudentMapper } from '../mappers/student.mapper';

@Injectable()
export class PrismaStudentRepository implements IStudentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(student: Student): Promise<Student> {
    const data = StudentMapper.toPersistence(student);
    const created = await this.prisma.student.create({
      data,
    });
    return StudentMapper.toDomain(created);
  }

  async findAll(): Promise<Student[]> {
    const students = await this.prisma.student.findMany();
    return students.map((prismaStudent) =>
      StudentMapper.toDomain(prismaStudent),
    );
  }

  async findById(id: string): Promise<Student | null> {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      return null;
    }

    return StudentMapper.toDomain(student);
  }

  async findByUserId(userId: string): Promise<Student | null> {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return null;
    }

    return StudentMapper.toDomain(student);
  }

  async update(student: Student): Promise<Student> {
    const data = StudentMapper.toPersistence(student);
    const updated = await this.prisma.student.update({
      where: { id: student.id },
      data,
    });

    return StudentMapper.toDomain(updated);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.student.delete({
      where: { id },
    });
  }

  async getStudentWithFullRelations(id: string): Promise<any> {
    return this.prisma.student.findUnique({
      where: { id },
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
