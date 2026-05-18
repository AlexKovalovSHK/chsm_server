import { Student } from '../entities/student.entity';

export abstract class IStudentRepository {
  abstract create(student: Student, organizationId: string): Promise<Student>;
  abstract findAll(organizationId: string): Promise<Student[]>;
  abstract findById(
    id: string,
    organizationId: string,
  ): Promise<Student | null>;
  abstract findByUserId(
    userId: string,
    organizationId: string,
  ): Promise<Student | null>;
  abstract update(student: Student, organizationId: string): Promise<Student>;
  abstract remove(id: string, organizationId: string): Promise<void>;
  abstract getStudentWithFullRelations(
    id: string,
    organizationId: string,
  ): Promise<any>;
}
