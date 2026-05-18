import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EnrollmentController } from './controllers/enrollment.controller';
import { EnrollmentService } from './service/enrollment.service';
import { EnrollmentControllerV2 } from './controllers/enrollment.controller_v2';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';
import { OrganizationModule } from 'src/organization/organization.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, OrganizationModule, JwtModule.register({})],
  controllers: [EnrollmentController, EnrollmentControllerV2],
  providers: [EnrollmentService, MultiTenancyGuard],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
