import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';

import { AdminAndTeacherGuard } from './auth/guards/admin_and_teacher.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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

// MCP Autonomous Integration
import { McpModule } from './mcp/mcp.module';
import { McpTransportType } from './mcp/interfaces';
import { StudentsMcpModule } from './mcp/modules/students/students_mcp.module';
import { UsersMcpModule } from './mcp/modules/users/users_mcp.module';
import { ClassroomMcpModule } from './mcp/modules/classroom/classroom_mcp.module';
import { TelegramMcpModule } from './mcp/modules/telegram/telegram_mcp.module';
import { AiChatMcpModule } from './mcp/modules/ai_chat/ai_chat.module';
import { McpSmModule } from './mcp_sm/mcp_sm.module';

@Module({})
export class AppModule {
  static register(): DynamicModule {
    // Manually load .env to check variables before bootstrap
    require('dotenv').config();
    const isDev = process.env.DEV === 'true';
    const isMcpEnabled = process.env.MCP_ENABLED === 'true';

    const imports: any[] = [
      ScheduleModule.forRoot(),
      ConfigModule.forRoot({ isGlobal: true }),
      // ... в импортах AppModule
      CacheModule.registerAsync({
        isGlobal: true,
        useFactory: async () => {
          try {
            const store = await redisStore({
              url: process.env.REDIS_URL || '',
              ttl: 3600000,
            });
            (store as any).client.on('error', (err: any) => {
              console.error('❌ Redis Client Error:', err.message);
            });
            return { store };
          } catch (error) {
            console.error(
              '❌ Could not connect to Redis, falling back to memory store',
            );
            return { store: 'memory' };
          }
        },
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
      McpSmModule,
    ];

    // MCP logic: only include if enabled in .env
    if (isMcpEnabled) {
      console.log('🚀 MCP Module is ENABLED');
      imports.push(
        McpModule.forRoot({
          name: 'CHSM-Classroom-MCP',
          version: '1.0.0',
          transport: [McpTransportType.SSE, McpTransportType.STDIO],
          apiPrefix: 'mcp',
        }),
        StudentsMcpModule,
        UsersMcpModule,
        ClassroomMcpModule,
        TelegramMcpModule,
        AiChatMcpModule,
      );
    } else {
      console.log('💤 MCP Module is DISABLED');
    }

    // Backup module logic
    if (!isDev) {
      console.log('✅ Adding BackupModule (Prod Mode)');
      imports.push(BackupModule);
    } else {
      console.log('❌ BackupModule NOT added (Dev Mode)');
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
