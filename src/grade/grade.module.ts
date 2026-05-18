import { Module } from '@nestjs/common';
import { GradeController } from './controller/grade.controller';
import { GradeService } from './service/grade.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';
import { OrganizationModule } from 'src/organization/organization.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, OrganizationModule, JwtModule.register({})],
  controllers: [GradeController],
  providers: [GradeService, MultiTenancyGuard],
  exports: [GradeService],
})
export class GradeModule {}
