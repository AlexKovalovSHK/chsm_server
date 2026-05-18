import { Module } from '@nestjs/common';
import { PracticesService } from './practices.service';
import { PracticesController } from './practices.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';
import { OrganizationModule } from 'src/organization/organization.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, OrganizationModule, JwtModule.register({})],
  controllers: [PracticesController],
  providers: [PracticesService, MultiTenancyGuard],
})
export class PracticesModule {}
