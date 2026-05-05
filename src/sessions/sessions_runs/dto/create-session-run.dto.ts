import { IsString, IsUUID, IsEnum, IsNotEmpty } from 'class-validator';
import { SessionStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionRunDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  levelId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  academicYearId: string;

  @ApiProperty({ example: '123456789012' })
  @IsString()
  @IsNotEmpty()
  classroomCourseId: string;

  @ApiProperty({ enum: SessionStatus })
  @IsEnum(SessionStatus)
  status: SessionStatus;
}