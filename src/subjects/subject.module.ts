import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SubjectController } from './controllers/subject.controller';
import { SubjectService } from './service/subject.service';
import { SubjectControllerV2 } from './controllers/subject.controller_v2';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';
import { OrganizationModule } from 'src/organization/organization.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, OrganizationModule, JwtModule.register({})],
  controllers: [SubjectController, SubjectControllerV2],
  providers: [SubjectService, MultiTenancyGuard],
  exports: [SubjectService],
})
export class SubjectModule {}
