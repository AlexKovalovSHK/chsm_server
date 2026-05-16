import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnrollmentDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  studentId: string;

  @Expose()
  @ApiProperty()
  sessionRunId: string;

  @Expose()
  @ApiProperty()
  enrolledAt: string;

  @Expose()
  @ApiProperty()
  status: string;

  @Expose()
  @ApiPropertyOptional({ type: String, nullable: true })
  approvedAt: string | null;

  @Expose()
  @ApiPropertyOptional({ type: String, nullable: true })
  approvedBy: string | null;

  @Expose()
  @ApiPropertyOptional({ type: String, nullable: true })
  teacherName: string | null;
}
