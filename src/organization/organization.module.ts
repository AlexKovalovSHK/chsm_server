import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { PrismaOrganizationRepository } from './repositories/prisma-organization.repository';

@Module({
  imports: [PrismaModule],
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    {
      provide: 'IOrganizationRepository',
      useClass: PrismaOrganizationRepository,
    },
  ],
  exports: [OrganizationService],
})
export class OrganizationModule {}
