import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminAndTeacherGuard } from './auth/guards/admin_and_teacher.guard';
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
import { McpModule } from './mcp/mcp.module';

@Module({})
export class AppModule {
  static register(): DynamicModule {
    require('dotenv').config();
    const isDev = process.env.DEV === 'true';

    const imports = [
      ScheduleModule.forRoot(),
      ConfigModule.forRoot({ isGlobal: true }),
      CacheModule.registerAsync({
        isGlobal: true,
        useFactory: async () => ({
          store: await redisStore({
            url: process.env.REDIS_URL,
            ttl: 3600000, // 1 час
          }),
        }),
      }),
      PrismaModule,
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
      GradebookModule,
      McpModule,
    ];

    if (!isDev) {
      console.log('✅ Добавляем BackupModule в imports');
      imports.push(BackupModule);
    } else {
      console.log('❌ BackupModule НЕ добавлен (DEV режим)');
    }

    return {
      module: AppModule,
      imports,
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: APP_GUARD,
          useClass: AdminAndTeacherGuard,
        },
      ],
    };
  }
}

/*@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ...(process.env.DEV !== 'true' ? [BackupModule] : []),
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
export class AppModule { }*/
