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
import { StudentFullReportDto } from './dto/student_full_reaport.dto';

@Injectable()
export class StudentService {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async create(dto: CreateStudentDto, organizationId: string) {
    console.log(dto);

    const existing = await this.studentRepository.findByUserId(
      dto.userId,
      organizationId,
    );
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
      gradebookNumber: dto.gradebookNumber,
      gradebookIssuedAt: dto.gradebookIssuedAt
        ? new Date(dto.gradebookIssuedAt)
        : new Date(),
    });

    return this.studentRepository.create(student, organizationId);
  }

  async findAll(organizationId: string) {
    return this.studentRepository.findAll(organizationId);
  }

  async findOne(id: string, organizationId: string) {
    const student = await this.studentRepository.findById(id, organizationId);
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return student;
  }

  async findOneByUserId(
    userId: string,
    organizationId: string,
  ): Promise<Student> {
    const student = await this.studentRepository.findByUserId(
      userId,
      organizationId,
    );
    if (!student) {
      throw new NotFoundException(`Student with ID ${userId} not found`);
    }
    return student;
  }

  async fullreportByStudentId(
    id: string,
    organizationId: string,
  ): Promise<StudentFullReportDto> {
    const studentData =
      await this.studentRepository.getStudentWithFullRelations(
        id,
        organizationId,
      );

    if (!studentData) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    const studentResp = {
      id: studentData.id,
      userId: studentData.userId,
      instrument: studentData.instrument,
      specialization: studentData.specialization,
      name: studentData.name,
      nameRu: studentData.nameRu,
      city: studentData.city,
      country: studentData.country,
      telegramId: studentData.telegramId,
      classroomUserId: studentData.classroomUserId,
      enrolledAt: studentData.enrolledAt,
      gradebookNumber: studentData.gradebookNumber,
      gradebookIssuedAt: studentData.gradebookIssuedAt,
    };

    const academicYearsMap = new Map<string, any>();

    for (const enrollment of studentData.enrollments || []) {
      const sessionRun = enrollment.sessionRun;
      if (!sessionRun) continue;

      const ay = sessionRun.academicYear;
      if (!ay) continue;

      if (!academicYearsMap.has(ay.id)) {
        academicYearsMap.set(ay.id, {
          id: ay.id,
          label: ay.label,
          startsAt: ay.startsAt,
          endsAt: ay.endsAt,
          sessionRuns: [],
        });
      }

      const academicYearDto = academicYearsMap.get(ay.id)!;

      const subjectsDto = (sessionRun.subjects || []).map((subject: any) => {
        const gradeEntry = (enrollment.gradeEntries || []).find(
          (g: any) => g.subjectId === subject.id,
        );

        return {
          id: subject.id,
          levelId: subject.levelId,
          title: subject.title,
          teacherName: subject.teacherName,
          hours: subject.hours,
          classroomCourseworkId: subject.classroomCourseworkId,
          hasClassroom: subject.hasClassroom,
          sessionRunId: subject.sessionRunId,
          scale: subject.scale,
          isCore: subject.isCore,
          level: subject.level?.number,
          grade: gradeEntry ? gradeEntry.value : undefined,
        };
      });

      academicYearDto.sessionRuns.push({
        id: sessionRun.id,
        levelId: sessionRun.levelId,
        academicYearId: sessionRun.academicYearId,
        classroomCourseId: sessionRun.classroomCourseId,
        status: sessionRun.status,
        level: sessionRun.level?.title,
        subjects: subjectsDto,
      });
    }

    const academicYear = Array.from(academicYearsMap.values());

    return {
      student: studentResp,
      academicYear,
    };
  }

  async update(id: string, dto: UpdateStudentDto, organizationId: string) {
    const student = await this.findOne(id, organizationId);

    student.updateProfile({
      ...dto,
      enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : undefined,
      gradebookIssuedAt: dto.gradebookIssuedAt
        ? new Date(dto.gradebookIssuedAt)
        : undefined,
    });

    return this.studentRepository.update(student, organizationId);
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.studentRepository.remove(id, organizationId);
  }
}
