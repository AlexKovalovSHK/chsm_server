import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SessionRunController } from './controller/session-run.controller';
import { SessionRunService } from './service/session-run.service';

@Module({
  imports: [PrismaModule],
  controllers: [SessionRunController],
  providers: [SessionRunService],
  exports: [SessionRunService],
})
export class SessionRunModule {}
