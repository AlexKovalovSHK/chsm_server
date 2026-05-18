import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SessionLevelController } from './controller/session-level.controller';
import { SessionLevelService } from './service/session-level.service';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [SessionLevelController],
  providers: [SessionLevelService, MultiTenancyGuard],
})
export class SessionLevelModule {}
