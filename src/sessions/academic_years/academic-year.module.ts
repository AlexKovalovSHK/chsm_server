import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AcademicYearController } from './controller/academic-year.controller';
import { AcademicYearService } from './service/academic-year.service';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';
import { OrganizationModule } from 'src/organization/organization.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, OrganizationModule, JwtModule.register({})],
  controllers: [AcademicYearController],
  providers: [AcademicYearService, MultiTenancyGuard],
  exports: [AcademicYearService],
})
export class AcademicYearModule {}
