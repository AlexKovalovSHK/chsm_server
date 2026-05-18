import { Module } from '@nestjs/common';
import { StudentsMcpTool } from './students_mcp.tools';
import { StudentModule } from 'src/students/student.module';
import { OrganizationModule } from 'src/organization/organization.module';

@Module({
  imports: [StudentModule, OrganizationModule],
  providers: [StudentsMcpTool],
  exports: [StudentsMcpTool],
})
export class StudentsMcpModule {}
