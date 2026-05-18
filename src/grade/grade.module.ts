import { Module } from '@nestjs/common';
import { GradeController } from './controller/grade.controller';
import { GradeService } from './service/grade.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [GradeController],
  providers: [GradeService, MultiTenancyGuard],
  exports: [GradeService],
})
export class GradeModule {}
