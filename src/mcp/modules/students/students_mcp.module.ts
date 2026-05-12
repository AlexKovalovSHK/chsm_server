import { Module } from '@nestjs/common';
import { StudentsMcpTool } from './students_mcp.tools';
import { StudentModule } from 'src/students/student.module';

@Module({
  imports: [StudentModule],
  providers: [StudentsMcpTool],
  exports: [StudentsMcpTool],
})
export class StudentsMcpModule {}
