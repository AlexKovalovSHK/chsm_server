import { Injectable } from '@nestjs/common';
import { Tool } from 'src/mcp/decorators';
import { StudentService } from 'src/students/service/student.service';
import { z } from 'zod';

@Injectable()
export class StudentsMcpTool {
  constructor(private readonly studentService: StudentService) { }

  @Tool({
    name: 'list-students',
    description: 'Get a list of all students.',
  })
  async listStudents() {
    try {
      return await this.studentService.findAll();
    } catch (err: any) {
      console.error('Error listing students:', err.message);
      return { error: err.message };
    }
  }

  @Tool({
    name: 'get-student',
    description: 'Get student details. IMPORTANT: You must provide a full UUID string, not a serial number.',
    parameters: z.object({
      // Добавляем .uuid(), чтобы ИИ видел ошибку формата
      studentId: z.string().uuid().describe('The long UUID string (e.g. "550e8400-e29b...")'),
    }),
  })
  async getStudent({ studentId }: { studentId: string }) {
    // Дополнительная проверка внутри метода
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(studentId)) {
      return {
        error: `"${studentId}" is not a valid UUID. Please find the correct UUID in the list-students output.`
      };
    }

    try {
      return await this.studentService.findOne(studentId);
    } catch (err: any) {
      return { error: err.message };
    }
  }
}
