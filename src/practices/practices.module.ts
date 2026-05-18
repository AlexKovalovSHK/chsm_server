import { Module } from '@nestjs/common';
import { PracticesService } from './practices.service';
import { PracticesController } from './practices.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [PracticesController],
  providers: [PracticesService, MultiTenancyGuard],
})
export class PracticesModule {}
