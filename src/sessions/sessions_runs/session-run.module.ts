import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SessionRunController } from './controller/session-run.controller';
import { SessionRunService } from './service/session-run.service';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';
import { OrganizationModule } from 'src/organization/organization.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, OrganizationModule, JwtModule.register({})],
  controllers: [SessionRunController],
  providers: [SessionRunService, MultiTenancyGuard],
  exports: [SessionRunService],
})
export class SessionRunModule {}
