import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    const existing = await this.prisma.student.findUnique({
      where: { userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException(`Student with userId ${dto.userId} already exists`);
    }

    return this.prisma.student.create({
      data: {
        ...dto,
        enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : undefined,
      },
      include: { user: true },
    });
  }

  async findAll() {
    return this.prisma.student.findMany({
      include: { user: true },
    });
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);
    return this.prisma.student.update({
      where: { id },
      data: {
        ...dto,
        enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : undefined,
      },
      include: { user: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.student.delete({
      where: { id },
    });
  }
}
