import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SubjectController } from './controllers/subject.controller';
import { SubjectService } from './service/subject.service';
import { SubjectControllerV2 } from './controllers/subject.controller_v2';

@Module({
  imports: [PrismaModule],
  controllers: [SubjectController, SubjectControllerV2],
  providers: [SubjectService],
  exports: [SubjectService],
})
export class SubjectModule {}
