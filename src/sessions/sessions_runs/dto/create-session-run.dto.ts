import { IsString, IsUUID, IsEnum, IsNotEmpty } from 'class-validator';
import { SessionStatus } from '@prisma/client';

export class CreateSessionRunDto {
  @IsUUID()
  levelId: string;

  @IsUUID()
  academicYearId: string;

  @IsString()
  @IsNotEmpty()
  classroomCourseId: string;

  @IsEnum(SessionStatus)
  status: SessionStatus;
}