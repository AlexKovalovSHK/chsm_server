import { Module } from '@nestjs/common';
import { TelegramMcpTool } from './telegram_mcp.tools';
import { TelegramModule } from 'src/telegram/tg.module';
import { ClassroomModule } from 'src/classroom/classrom.module';

@Module({
  imports: [TelegramModule, ClassroomModule],
  providers: [TelegramMcpTool],
  exports: [TelegramMcpTool],
})
export class TelegramMcpModule {}
