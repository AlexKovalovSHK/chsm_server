import { Module } from '@nestjs/common';
import { NvidiaTestController } from './chat_tools/nvidia-test.controller';

@Module({
  controllers: [NvidiaTestController],
  providers: [],
  exports: [],
})
export class McpModule {}