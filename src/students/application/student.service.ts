import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { IStudentRepository } from '../domain/repositories/student.repository.interface';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student } from '../domain/entities/student.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class StudentService {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async create(dto: CreateStudentDto) {
    console.log(dto);

    const existing = await this.studentRepository.findByUserId(dto.userId);
    if (existing) {
      throw new ConflictException(
        `Student with userId ${dto.userId} already exists`,
      );
    }

    const student = new Student({
      id: randomUUID(),
      userId: dto.userId,
      instrument: dto.instrument,
      specialization: dto.specialization,
      name: dto.name,
      nameRu: dto.nameRu,
      city: dto.city,
      country: dto.country,
      telegramId: dto.telegramId,
      classroomUserId: dto.classroomUserId,
      enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : new Date(),
    });

    return this.studentRepository.create(student);
  }

  async findAll() {
    return this.studentRepository.findAll();
  }

  async findOne(id: string) {
    const student = await this.studentRepository.findById(id);
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    const student = await this.findOne(id);

    student.updateProfile({
      ...dto,
      enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : undefined,
    });

    return this.studentRepository.update(student);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.studentRepository.remove(id);
  }
}
