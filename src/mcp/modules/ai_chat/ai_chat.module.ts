import { Module } from '@nestjs/common';
import { AiChatMcpTool } from './ai_chat.tools';
import { McpModule } from '../../mcp.module';

@Module({
  imports: [McpModule],
  providers: [AiChatMcpTool],
  exports: [AiChatMcpTool],
})
export class AiChatMcpModule {}
