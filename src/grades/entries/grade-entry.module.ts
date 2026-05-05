import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GradeEntryController } from './controller/grade-entry.controller';
import { GradeEntryService } from './service/grade-entry.service';

@Module({
  imports: [PrismaModule],
  controllers: [GradeEntryController],
  providers: [GradeEntryService],
  exports: [GradeEntryService],
})
export class GradeEntryModule {}
