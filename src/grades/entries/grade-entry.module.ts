import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GradeEntryController } from './controller/grade-entry.controller';
import { GradeEntryService } from './service/grade-entry.service';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [GradeEntryController],
  providers: [GradeEntryService, MultiTenancyGuard],
  exports: [GradeEntryService],
})
export class GradeEntryModule {}
