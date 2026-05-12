import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SessionLevelController } from './controller/session-level.controller';
import { SessionLevelService } from './service/session-level.service';

@Module({
  imports: [PrismaModule],
  controllers: [SessionLevelController],
  providers: [SessionLevelService],
})
export class SessionLevelModule {}
