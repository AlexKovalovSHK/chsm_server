export interface StudentFullReportDto {
  student: StudentResponsDto;
  academicYear: AcademicYearDto[];
}

export interface StudentResponsDto {
  id: string;
  userId: string;
  instrument: string;
  specialization: string;
  name: string;
  nameRu: string;
  city?: string;
  country?: string;
  telegramId?: string;
  classroomUserId?: string;
  enrolledAt: Date;
  gradebookNumber: string;
  gradebookIssuedAt: Date;
}

export interface AcademicYearDto {
  id: string;
  label: string;
  startsAt: Date;
  endsAt: Date;
  sessionRuns: SessionRunDto[];
}

export interface SessionRunDto {
  id: string;
  levelId: string;
  academicYearId: string;
  classroomCourseId?: string;
  status: string;
  level: string;
  subjects: SubjectDto[];
}

export interface SubjectDto {
  id: string;
  levelId: string;
  title: string;
  teacherName: string;
  hours?: number;
  classroomCourseworkId?: string;
  hasClassroom: boolean;
  sessionRunId: string;
  scale: number;
  isCore: boolean;
  level: number;
  grade?: number;
}
