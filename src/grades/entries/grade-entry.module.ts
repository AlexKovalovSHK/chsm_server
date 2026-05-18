import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GradeEntryController } from './controller/grade-entry.controller';
import { GradeEntryService } from './service/grade-entry.service';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';
import { OrganizationModule } from 'src/organization/organization.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, OrganizationModule, JwtModule.register({})],
  controllers: [GradeEntryController],
  providers: [GradeEntryService, MultiTenancyGuard],
  exports: [GradeEntryService],
})
export class GradeEntryModule {}
