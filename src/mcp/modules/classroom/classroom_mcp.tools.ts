import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '../../decorators';
import { ClassroomService } from '../../../classroom/service/classroom.service';
import { z } from 'zod';

@Injectable()
export class ClassroomMcpTool {
  private readonly logger = new Logger(ClassroomMcpTool.name);

  constructor(private readonly classroomService: ClassroomService) {}

  @Tool({
    name: 'list-classroom-courses',
    description: 'Get a list of all active Google Classroom courses.',
  })
  async listCourses() {
    try {
      this.logger.debug('MCP list-classroom-courses');
      const adminTokens = await this.classroomService.getAdminTokens();
      if (!adminTokens) {
        return {
          error:
            'System is not authorized with Google Classroom admin account.',
        };
      }
      return await this.classroomService.getCourses(adminTokens);
    } catch (err: any) {
      this.logger.error(`Error listing classroom courses: ${err.message}`);
      return { error: err.message };
    }
  }

  @Tool({
    name: 'get-classroom-report',
    description:
      'Get a full live report of the school state from Google Classroom, including all courses and their participants.',
    parameters: z.object({
      refresh: z
        .boolean()
        .optional()
        .describe('Force refresh the cache (default: false)'),
    }),
  })
  async getLiveReport({ refresh }: { refresh?: boolean }) {
    try {
      this.logger.debug(`MCP get-classroom-report (refresh: ${refresh})`);
      const adminTokens = await this.classroomService.getAdminTokens();
      if (!adminTokens) {
        return { error: 'System is not authorized' };
      }
      return await this.classroomService.getLiveFullState(adminTokens, refresh);
    } catch (err: any) {
      this.logger.error(`Error getting live report: ${err.message}`);
      return { error: err.message };
    }
  }

  @Tool({
    name: 'get-course-students',
    description:
      'Get a list of all unique students across all Google Classroom courses.',
  })
  async getAllStudents() {
    try {
      this.logger.debug('MCP get-course-students');
      const adminTokens = await this.classroomService.getAdminTokens();
      if (!adminTokens) {
        return { error: 'System is not authorized' };
      }
      return await this.classroomService.getAllStudents(adminTokens);
    } catch (err: any) {
      this.logger.error(`Error getting all classroom students: ${err.message}`);
      return { error: err.message };
    }
  }

  @Tool({
    name: 'get-student-grades',
    description:
      'Get the grades and profile of a specific student from all Google Classroom courses by their email.',
    parameters: z.object({
      email: z
        .string()
        .email()
        .describe('The Google Email address of the student'),
    }),
  })
  async getStudentGrades({ email }: { email: string }) {
    try {
      this.logger.debug(`MCP get-student-grades for email: ${email}`);
      const adminTokens = await this.classroomService.getAdminTokens();
      if (!adminTokens) {
        return { error: 'System is not authorized' };
      }
      return await this.classroomService.getStudentGrades(adminTokens, email);
    } catch (err: any) {
      this.logger.error(
        `Error getting student grades for ${email}: ${err.message}`,
      );
      return { error: err.message };
    }
  }
}
