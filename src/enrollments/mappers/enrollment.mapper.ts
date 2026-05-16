import { Enrollment } from '@prisma/client';
import { EnrollmentDto } from '../dto/enrollment.dto';
import { plainToInstance } from 'class-transformer';

export class EnrollmentMapper {
  static toDto(enrollment: Enrollment): EnrollmentDto {
    return plainToInstance(
      EnrollmentDto,
      {
        ...enrollment,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        approvedAt: enrollment.approvedAt?.toISOString() || null,
        teacherName: enrollment.teacherName || null,
      },
      { excludeExtraneousValues: true },
    );
  }
}
