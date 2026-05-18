import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GradebookController } from './controller/gradebook.controller';
import { GradebookService } from './service/gradebook.service';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';
import { OrganizationModule } from 'src/organization/organization.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, OrganizationModule, JwtModule.register({})],
  controllers: [GradebookController],
  providers: [GradebookService, MultiTenancyGuard],
  exports: [GradebookService],
})
export class GradebookModule {}
