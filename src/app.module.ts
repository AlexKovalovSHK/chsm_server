import { Module } from '@nestjs/common';

import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClassroomModule } from './classroom/classrom.module';
import { UsersModule } from './users/users.module';
import { TelegramModule } from './telegram/tg.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AcademicYearModule } from './sessions/academic_years/academic-year.module';
import { SessionLevelModule } from './sessions/session_levels/session-level.module';
import { SessionRunModule } from './sessions/sessions_runs/session-run.module';
import { StudentModule } from './students/student.module';
import { SubjectModule } from './subjects/subject.module';
import { EnrollmentModule } from './enrollments/enrollment.module';
import { GradeEntryModule } from './grades/entries/grade-entry.module';
import { GradebookModule } from './grades/gradebooks/gradebook.module';
import { BackupModule } from './backup/backup.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    BackupModule,
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    TelegramModule,
    ClassroomModule,
    AcademicYearModule,
    SessionLevelModule,
    SessionRunModule,
    StudentModule,
    SubjectModule,
    EnrollmentModule,
    GradeEntryModule,
    GradebookModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

