import { Module } from '@nestjs/common';
import { UserMcpTool } from './user_mcp.tools';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  providers: [UserMcpTool],
  exports: [UserMcpTool],
})
export class UsersMcpModule {}
