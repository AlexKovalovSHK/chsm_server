import { Module } from '@nestjs/common';
import { ClassroomMcpTool } from './classroom_mcp.tools';
import { ClassroomModule } from 'src/classroom/classrom.module';

@Module({
  imports: [ClassroomModule],
  providers: [ClassroomMcpTool],
  exports: [ClassroomMcpTool],
})
export class ClassroomMcpModule {}
