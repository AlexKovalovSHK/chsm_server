import { Injectable } from '@nestjs/common';
import { Tool } from 'src/mcp/decorators';
import { StudentService } from 'src/students/application/student.service';
import { OrganizationService } from 'src/organization/organization.service';
import { z } from 'zod';

@Injectable()
export class StudentsMcpTool {
  private defaultOrgId: string | null = null;

  constructor(
    private readonly studentService: StudentService,
    private readonly orgService: OrganizationService,
  ) {}

  private async getOrgId(): Promise<string> {
    if (!this.defaultOrgId) {
      const org = await this.orgService.getDefaultOrganization();
      this.defaultOrgId = org.id;
    }
    return this.defaultOrgId;
  }

  @Tool({
    name: 'list-students',
    description: 'Get a list of all students.',
  })
  async listStudents() {
    try {
      const orgId = await this.getOrgId();
      return await this.studentService.findAll(orgId);
    } catch (err: any) {
      console.error('Error listing students:', err.message);
      return { error: err.message };
    }
  }

  @Tool({
    name: 'get-student',
    description:
      'Get student details. IMPORTANT: You must provide a full UUID string, not a serial number.',
    parameters: z.object({
      // Добавляем .uuid(), чтобы ИИ видел ошибку формата
      studentId: z
        .string()
        .uuid()
        .describe('The long UUID string (e.g. "550e8400-e29b...")'),
    }),
  })
  async getStudent({ studentId }: { studentId: string }) {
    // Дополнительная проверка внутри метода
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(studentId)) {
      return {
        error: `"${studentId}" is not a valid UUID. Please find the correct UUID in the list-students output.`,
      };
    }

    try {
      const orgId = await this.getOrgId();
      return await this.studentService.findOne(studentId, orgId);
    } catch (err: any) {
      return { error: err.message };
    }
  }
}
