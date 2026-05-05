import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SubjectController } from './controller/subject.controller';
import { SubjectService } from './service/subject.service';

@Module({
  imports: [PrismaModule],
  controllers: [SubjectController],
  providers: [SubjectService],
  exports: [SubjectService],
})
export class SubjectModule {}
