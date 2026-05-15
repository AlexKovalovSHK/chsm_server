import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePracticeDto } from './dto/create-practice.dto';
import { UpdatePracticeDto } from './dto/update-practice.dto';
import { PracticeDto } from './dto/practice.dto';
import { CreatePracticeEntryDto } from './dto/create-practice-entry.dto';
import { UpdatePracticeEntryDto } from './dto/update-practice-entry.dto';
import { PracticeEntryDto } from './dto/practice-entry.dto';
import { plainToInstance } from 'class-transformer';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@Injectable()
export class PracticesService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Practices CRUD
  // ---------------------------------------------------------------------------

  async create(
    createPracticeDto: CreatePracticeDto,
    user: JwtPayload,
  ): Promise<PracticeDto> {
    // Student can create a practice only for his own enrollment
    if (user.role === 'student') {
      await this.assertEnrollmentOwnership(
        createPracticeDto.enrollmentId,
        user.userId,
      );
    }

    const existing = await this.prisma.practice.findUnique({
      where: {
        enrollment_id_practice_type: {
          enrollment_id: createPracticeDto.enrollmentId,
          practice_type: createPracticeDto.practiceType,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Practice journal for this type and enrollment already exists',
      );
    }

    const practice = await this.prisma.practice.create({
      data: {
        enrollment_id: createPracticeDto.enrollmentId,
        practice_type: createPracticeDto.practiceType,
      },
    });

    return this.mapToPracticeDto(practice);
  }

  async findAll(
    user?: JwtPayload,
    enrollmentId?: string,
  ): Promise<PracticeDto[]> {
    // Build where clause based on role
    const where: any = {};

    if (enrollmentId) {
      where.enrollment_id = enrollmentId;
    }

    // For student — only practices from their own enrollments
    if (user && user.role === 'student') {
      const studentEnrollmentIds = await this.getStudentEnrollmentIds(
        user.userId,
      );
      where.enrollment_id = enrollmentId ?? { in: studentEnrollmentIds };
    }

    const practices = await this.prisma.practice.findMany({ where });

    return practices.map((p) => this.mapToPracticeDto(p));
  }

  async findOne(id: string, user: JwtPayload): Promise<PracticeDto> {
    const practice = await this.prisma.practice.findUnique({
      where: { id },
      include: { entries: true },
    });

    if (!practice) {
      throw new NotFoundException('Practice not found');
    }

    // Student can see only his own practices
    if (user.role === 'student') {
      await this.assertEnrollmentOwnership(practice.enrollment_id, user.userId);
    }

    return this.mapToPracticeDto(practice);
  }

  async update(
    id: string,
    updatePracticeDto: UpdatePracticeDto,
    user: JwtPayload,
  ): Promise<PracticeDto> {
    const practice = await this.prisma.practice.findUnique({ where: { id } });
    if (!practice) {
      throw new NotFoundException('Practice not found');
    }

    // Student can update only his own practice
    if (user.role === 'student') {
      await this.assertEnrollmentOwnership(practice.enrollment_id, user.userId);
    }

    const updated = await this.prisma.practice.update({
      where: { id },
      data: {
        practice_status: updatePracticeDto.practiceStatus,
      },
    });

    return this.mapToPracticeDto(updated);
  }

  async remove(id: string, user: JwtPayload): Promise<void> {
    const practice = await this.prisma.practice.findUnique({ where: { id } });
    if (!practice) {
      throw new NotFoundException('Practice not found');
    }

    // Student can delete only his own practice
    if (user.role === 'student') {
      await this.assertEnrollmentOwnership(practice.enrollment_id, user.userId);
    }

    await this.prisma.practice.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // Practice Entries CRUD
  // ---------------------------------------------------------------------------

  async createEntry(
    practiceId: string,
    createDto: CreatePracticeEntryDto,
    user: JwtPayload,
  ): Promise<PracticeEntryDto> {
    const practice = await this.prisma.practice.findUnique({
      where: { id: practiceId },
    });
    if (!practice) {
      throw new NotFoundException('Practice not found');
    }

    // Student can add entries only to his own practice
    if (user.role === 'student') {
      await this.assertEnrollmentOwnership(practice.enrollment_id, user.userId);
    }

    if (practice.practice_type === 'LITURGICAL' && !createDto.serviceKind) {
      throw new BadRequestException(
        'serviceKind is required for LITURGICAL practice',
      );
    }

    if (practice.practice_type === 'PEDAGOGICAL' && !createDto.location) {
      throw new BadRequestException(
        'location is required for PEDAGOGICAL practice',
      );
    }

    const entry = await this.prisma.practiceEntry.create({
      data: {
        practice_id: practiceId,
        title: createDto.title,
        service_kind:
          practice.practice_type === 'LITURGICAL'
            ? createDto.serviceKind
            : null,
        location:
          practice.practice_type === 'PEDAGOGICAL' ? createDto.location : null,
        date: new Date(createDto.date),
      },
    });

    return this.mapToPracticeEntryDto(entry);
  }

  async findEntries(
    practiceId: string,
    user: JwtPayload,
  ): Promise<PracticeEntryDto[]> {
    const practice = await this.prisma.practice.findUnique({
      where: { id: practiceId },
    });
    if (!practice) {
      throw new NotFoundException('Practice not found');
    }

    // Student can see entries only of his own practice
    if (user.role === 'student') {
      await this.assertEnrollmentOwnership(practice.enrollment_id, user.userId);
    }

    const entries = await this.prisma.practiceEntry.findMany({
      where: { practice_id: practiceId },
    });

    return entries.map((e) => this.mapToPracticeEntryDto(e));
  }

  async updateEntry(
    practiceId: string,
    entryId: string,
    updateDto: UpdatePracticeEntryDto,
    user: JwtPayload,
  ): Promise<PracticeEntryDto> {
    const practice = await this.prisma.practice.findUnique({
      where: { id: practiceId },
    });
    if (!practice) {
      throw new NotFoundException('Practice not found');
    }

    // Student can update entries only in his own practice
    if (user.role === 'student') {
      await this.assertEnrollmentOwnership(practice.enrollment_id, user.userId);
    }

    const entry = await this.prisma.practiceEntry.findFirst({
      where: { id: entryId, practice_id: practiceId },
    });

    if (!entry) {
      throw new NotFoundException('Practice entry not found');
    }

    if (updateDto.serviceKind && practice.practice_type !== 'LITURGICAL') {
      throw new BadRequestException(
        'serviceKind is only for LITURGICAL practice',
      );
    }

    if (updateDto.location && practice.practice_type !== 'PEDAGOGICAL') {
      throw new BadRequestException(
        'location is only for PEDAGOGICAL practice',
      );
    }

    const updatedEntry = await this.prisma.practiceEntry.update({
      where: { id: entryId },
      data: {
        title: updateDto.title !== undefined ? updateDto.title : undefined,
        service_kind:
          practice.practice_type === 'LITURGICAL' &&
          updateDto.serviceKind !== undefined
            ? updateDto.serviceKind
            : undefined,
        location:
          practice.practice_type === 'PEDAGOGICAL' &&
          updateDto.location !== undefined
            ? updateDto.location
            : undefined,
        date: updateDto.date ? new Date(updateDto.date) : undefined,
      },
    });

    return this.mapToPracticeEntryDto(updatedEntry);
  }

  async approveEntry(
    practiceId: string,
    entryId: string,
    approvedBy: string | undefined,
    user: JwtPayload,
  ): Promise<PracticeEntryDto> {
    // Only admin/teacher can approve
    if (user.role === 'student') {
      throw new ForbiddenException('Only admin or teacher can approve entries');
    }

    const entry = await this.prisma.practiceEntry.findFirst({
      where: { id: entryId, practice_id: practiceId },
    });

    if (!entry) {
      throw new NotFoundException('Practice entry not found');
    }

    if (entry.approved_at) {
      throw new BadRequestException('Already approved');
    }

    const updatedEntry = await this.prisma.practiceEntry.update({
      where: { id: entryId },
      data: {
        approved_at: new Date(),
        approved_by: approvedBy || user.userId,
      },
    });

    return this.mapToPracticeEntryDto(updatedEntry);
  }

  async removeEntry(
    practiceId: string,
    entryId: string,
    user: JwtPayload,
  ): Promise<void> {
    const practice = await this.prisma.practice.findUnique({
      where: { id: practiceId },
    });
    if (!practice) {
      throw new NotFoundException('Practice not found');
    }

    // Student can delete entries only in his own practice
    if (user.role === 'student') {
      await this.assertEnrollmentOwnership(practice.enrollment_id, user.userId);
    }

    const entry = await this.prisma.practiceEntry.findFirst({
      where: { id: entryId, practice_id: practiceId },
    });

    if (!entry) {
      throw new NotFoundException('Practice entry not found');
    }

    await this.prisma.practiceEntry.delete({ where: { id: entryId } });
  }

  // ---------------------------------------------------------------------------
  // Access control helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns the array of enrollment IDs that belong to a student identified
   * by the user's mongoId (JWT subject).
   */
  private async getStudentEnrollmentIds(userId: string): Promise<string[]> {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: { enrollments: { select: { id: true } } },
    });
    if (!student) {
      return [];
    }
    return student.enrollments.map((e) => e.id);
  }

  /**
   * Throws ForbiddenException if the given enrollment does NOT belong to
   * the student identified by the user's mongoId.
   */
  private async assertEnrollmentOwnership(
    enrollmentId: string,
    userId: string,
  ): Promise<void> {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        enrollments: {
          where: { id: enrollmentId },
          select: { id: true },
        },
      },
    });

    if (!student || student.enrollments.length === 0) {
      throw new ForbiddenException(
        'You do not have access to this practice journal',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Mappers
  // ---------------------------------------------------------------------------

  private mapToPracticeDto(practice: any): PracticeDto {
    return plainToInstance(
      PracticeDto,
      {
        ...practice,
        enrollmentId: practice.enrollment_id,
        practiceType: practice.practice_type,
        practiceStatus: practice.practice_status,
        entries: practice.entries
          ? practice.entries.map((e: any) => this.mapToPracticeEntryDto(e))
          : undefined,
      },
      { excludeExtraneousValues: true },
    );
  }

  private mapToPracticeEntryDto(entry: any): PracticeEntryDto {
    return plainToInstance(
      PracticeEntryDto,
      {
        ...entry,
        practiceId: entry.practice_id,
        serviceKind: entry.service_kind,
        approvedAt: entry.approved_at ? entry.approved_at.toISOString() : null,
        approvedBy: entry.approved_by,
        date: entry.date.toISOString().split('T')[0],
      },
      { excludeExtraneousValues: true },
    );
  }
}
