import { Module } from '@nestjs/common';
import { GradeService } from './service/grade.service';
import { GradeController } from './controller/grade.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GradeController],
  providers: [GradeService],
  exports: [GradeService], // Export GradeService if other modules need to use it
})
export class GradeModule {}
