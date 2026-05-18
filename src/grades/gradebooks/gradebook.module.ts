import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GradebookController } from './controller/gradebook.controller';
import { GradebookService } from './service/gradebook.service';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [GradebookController],
  providers: [GradebookService, MultiTenancyGuard],
  exports: [GradebookService],
})
export class GradebookModule {}
