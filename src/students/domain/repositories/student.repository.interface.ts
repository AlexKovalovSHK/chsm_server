import { Student } from '../entities/student.entity';

export abstract class IStudentRepository {
  abstract create(student: Student): Promise<Student>;
  abstract findAll(): Promise<Student[]>;
  abstract findById(id: string): Promise<Student | null>;
  abstract findByUserId(userId: string): Promise<Student | null>;
  abstract update(student: Student): Promise<Student>;
  abstract remove(id: string): Promise<void>;
}
