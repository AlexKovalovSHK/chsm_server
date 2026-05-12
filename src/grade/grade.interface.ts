import { GradeEntry } from '@prisma/client';

export interface GradeIService {
  createGrade(data: Omit<GradeEntry, 'id' | 'recordedAt'>): Promise<GradeEntry>;
  findAllGrades(): Promise<GradeEntry[]>;
  findGradeById(id: string): Promise<GradeEntry | null>;
  findGradesByEnrollmentId(enrollmentId: string): Promise<GradeEntry[]>;
  findGradesBySubjectId(subjectId: string): Promise<GradeEntry[]>;
  updateGrade(id: string, data: Partial<Omit<GradeEntry, 'id' | 'recordedAt'>>): Promise<GradeEntry>;
  deleteGrade(id: string): Promise<GradeEntry>;
}
