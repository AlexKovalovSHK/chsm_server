import { Student as PrismaStudent } from '@prisma/client';
import { Student as DomainStudent } from '../../domain/entities/student.entity';

export class StudentMapper {
  static toDomain(raw: PrismaStudent): DomainStudent {
    return new DomainStudent({
      id: raw.id,
      userId: raw.userId,
      instrument: raw.instrument,
      specialization: raw.specialization,
      name: raw.name,
      nameRu: raw.nameRu || raw.name,
      city: raw.city ?? undefined,
      country: raw.country ?? undefined,
      telegramId: raw.telegramId ?? undefined,
      classroomUserId: raw.classroomUserId ?? undefined,
      enrolledAt: raw.enrolledAt,
      gradebookNumber: raw.gradebookNumber,
      gradebookIssuedAt: raw.gradebookIssuedAt,
    });
  }

  static toPersistence(
    student: DomainStudent,
  ): Omit<PrismaStudent, 'organizationId'> {
    return {
      id: student.id,
      userId: student.userId,
      instrument: student.instrument,
      specialization: student.specialization,
      name: student.name,
      nameRu: student.nameRu,
      city: student.city ?? null,
      country: student.country ?? null,
      telegramId: student.telegramId ?? null,
      classroomUserId: student.classroomUserId ?? null,
      enrolledAt: student.enrolledAt,
      gradebookNumber: student.gradebookNumber,
      gradebookIssuedAt: student.gradebookIssuedAt,
    };
  }
}
