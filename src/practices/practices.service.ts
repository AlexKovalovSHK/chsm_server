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
    organizationId: string,
  ): Promise<PracticeDto> {
    // Student can create a practice only for himself
    if (user.role === 'student') {
      await this.assertStudentIdentity(
        createPracticeDto.studentId,
        user.userId,
        organizationId,
      );
    }

    const existing = await this.prisma.practice.findUnique({
      where: {
        studentId_practiceType: {
          studentId: createPracticeDto.studentId,
          practiceType: createPracticeDto.practiceType,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Practice journal of type ${createPracticeDto.practiceType} already exists for this student`,
      );
    }

    const practice = await this.prisma.practice.create({
      data: {
        studentId: createPracticeDto.studentId,
        practiceType: createPracticeDto.practiceType,
        organizationId,
      },
    });

    return this.mapToPracticeDto(practice);
  }

  async findAll(
    organizationId: string,
    user?: JwtPayload,
  ): Promise<PracticeDto[]> {
    const where: any = { organizationId };

    // For student — only their own practices
    if (user && user.role === 'student') {
      const studentId = await this.getStudentId(user.userId, organizationId);
      if (!studentId) {
        return [];
      }
      where.studentId = studentId;
    }

    const practices = await this.prisma.practice.findMany({ where });

    return practices.map((p) => this.mapToPracticeDto(p));
  }

  async findOne(
    id: string,
    user: JwtPayload,
    organizationId: string,
  ): Promise<PracticeDto> {
    const practice = await this.prisma.practice.findUnique({
      where: { id, organizationId },
      include: { entries: true },
    });

    if (!practice) {
      throw new NotFoundException('Practice not found');
    }

    return this.mapToPracticeDto(practice);
  }

  async update(
    id: string,
    updatePracticeDto: UpdatePracticeDto,
    user: JwtPayload,
    organizationId: string,
  ): Promise<PracticeDto> {
    const practice = await this.prisma.practice.findUnique({
      where: { id, organizationId },
    });
    if (!practice) {
      throw new NotFoundException('Practice not found');
    }

    // Student can update only his own practice
    if (user.role === 'student') {
      await this.assertPracticeOwnership(
        practice.studentId,
        user.userId,
        organizationId,
      );
    }

    const updated = await this.prisma.practice.update({
      where: { id: practice.id },
      data: {
        practiceStatus: updatePracticeDto.practiceStatus,
      },
    });

    return this.mapToPracticeDto(updated);
  }

  async remove(
    id: string,
    user: JwtPayload,
    organizationId: string,
  ): Promise<void> {
    const practice = await this.prisma.practice.findUnique({
      where: { id, organizationId },
    });
    if (!practice) {
      throw new NotFoundException('Practice not found');
    }

    // Student can delete only his own practice
    if (user.role === 'student') {
      await this.assertPracticeOwnership(
        practice.studentId,
        user.userId,
        organizationId,
      );
    }

    await this.prisma.practice.delete({
      where: { id: practice.id },
    });
  }

  // ---------------------------------------------------------------------------
  // Practice Entries CRUD
  // ---------------------------------------------------------------------------

  async createEntry(
    practiceId: string,
    createDto: CreatePracticeEntryDto,
    user: JwtPayload,
    organizationId: string,
  ): Promise<PracticeEntryDto> {
    const practice = await this.prisma.practice.findUnique({
      where: { id: practiceId, organizationId },
    });
    if (!practice) {
      throw new NotFoundException('Practice not found');
    }

    // Student can add entries only to his own practice
    if (user.role === 'student') {
      await this.assertPracticeOwnership(
        practice.studentId,
        user.userId,
        organizationId,
      );
    }

    if (practice.practiceType === 'LITURGICAL' && !createDto.serviceKind) {
      throw new BadRequestException(
        'serviceKind is required for LITURGICAL practice',
      );
    }

    if (practice.practiceType === 'PEDAGOGICAL' && !createDto.location) {
      throw new BadRequestException(
        'location is required for PEDAGOGICAL practice',
      );
    }

    const entry = await this.prisma.practiceEntry.create({
      data: {
        practiceId: practiceId,
        title: createDto.title,
        serviceKind:
          practice.practiceType === 'LITURGICAL' ? createDto.serviceKind : null,
        location:
          practice.practiceType === 'PEDAGOGICAL' ? createDto.location : null,
        date: new Date(createDto.date),
      },
    });

    return this.mapToPracticeEntryDto(entry);
  }

  async findEntries(
    practiceId: string,
    user: JwtPayload,
    organizationId: string,
  ): Promise<PracticeEntryDto[]> {
    const practice = await this.prisma.practice.findUnique({
      where: { id: practiceId, organizationId },
    });
    if (!practice) {
      throw new NotFoundException('Practice not found');
    }

    // Student can see entries only of his own practice
    if (user.role === 'student') {
      await this.assertPracticeOwnership(
        practice.studentId,
        user.userId,
        organizationId,
      );
    }

    const entries = await this.prisma.practiceEntry.findMany({
      where: { practiceId: practiceId },
    });

    return entries.map((e) => this.mapToPracticeEntryDto(e));
  }

  async updateEntry(
    practiceId: string,
    entryId: string,
    updateDto: UpdatePracticeEntryDto,
    user: JwtPayload,
    organizationId: string,
  ): Promise<PracticeEntryDto> {
    const practice = await this.prisma.practice.findUnique({
      where: { id: practiceId, organizationId },
    });
    if (!practice) {
      throw new NotFoundException('Practice not found');
    }

    // Student can update entries only in his own practice
    if (user.role === 'student') {
      await this.assertPracticeOwnership(
        practice.studentId,
        user.userId,
        organizationId,
      );
    }

    const entry = await this.prisma.practiceEntry.findFirst({
      where: { id: entryId, practiceId: practiceId },
    });

    if (!entry) {
      throw new NotFoundException('Practice entry not found');
    }

    if (updateDto.serviceKind && practice.practiceType !== 'LITURGICAL') {
      throw new BadRequestException(
        'serviceKind is only for LITURGICAL practice',
      );
    }

    if (updateDto.location && practice.practiceType !== 'PEDAGOGICAL') {
      throw new BadRequestException(
        'location is only for PEDAGOGICAL practice',
      );
    }

    const updatedEntry = await this.prisma.practiceEntry.update({
      where: { id: entryId },
      data: {
        title: updateDto.title !== undefined ? updateDto.title : undefined,
        serviceKind:
          practice.practiceType === 'LITURGICAL' &&
          updateDto.serviceKind !== undefined
            ? updateDto.serviceKind
            : undefined,
        location:
          practice.practiceType === 'PEDAGOGICAL' &&
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
      where: { id: entryId, practiceId: practiceId },
    });

    if (!entry) {
      throw new NotFoundException('Practice entry not found');
    }

    if (entry.approvedAt) {
      throw new BadRequestException('Already approved');
    }

    const updatedEntry = await this.prisma.practiceEntry.update({
      where: { id: entryId },
      data: {
        approvedAt: new Date(),
        approvedBy: approvedBy || user.userId,
      },
    });

    return this.mapToPracticeEntryDto(updatedEntry);
  }

  async removeEntry(
    practiceId: string,
    entryId: string,
    user: JwtPayload,
    organizationId: string,
  ): Promise<void> {
    const practice = await this.prisma.practice.findUnique({
      where: { id: practiceId, organizationId },
    });
    if (!practice) {
      throw new NotFoundException('Practice not found');
    }

    // Student can delete entries only in his own practice
    if (user.role === 'student') {
      await this.assertPracticeOwnership(
        practice.studentId,
        user.userId,
        organizationId,
      );
    }

    const entry = await this.prisma.practiceEntry.findFirst({
      where: { id: entryId, practiceId: practiceId },
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
   * Returns the student's internal id by their user's mongoId, or null if not found.
   */
  private async getStudentId(
    userId: string,
    organizationId: string,
  ): Promise<string | null> {
    const student = await this.prisma.student.findUnique({
      where: {
        organizationId_userId: { userId, organizationId },
      },
      select: { id: true },
    });
    return student?.id ?? null;
  }

  /**
   * Throws ForbiddenException if the given studentId does NOT belong to
   * the user identified by user mongoId.
   */
  private async assertStudentIdentity(
    studentId: string,
    userId: string,
    organizationId: string,
  ): Promise<void> {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, userId, organizationId },
      select: { id: true },
    });

    if (!student) {
      throw new ForbiddenException('You do not have access to this student');
    }
  }

  /**
   * Throws ForbiddenException if the practice's student_id does NOT belong to
   * the user identified by user mongoId.
   */
  private async assertPracticeOwnership(
    studentId: string,
    userId: string,
    organizationId: string,
  ): Promise<void> {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, userId, organizationId },
      select: { id: true },
    });

    if (!student) {
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
        approvedAt: entry.approvedAt ? entry.approvedAt.toISOString() : null,
        date: entry.date.toISOString().split('T')[0],
      },
      { excludeExtraneousValues: true },
    );
  }
}
