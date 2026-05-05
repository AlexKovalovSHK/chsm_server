import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GradebookController } from './controller/gradebook.controller';
import { GradebookService } from './service/gradebook.service';

@Module({
  imports: [PrismaModule],
  controllers: [GradebookController],
  providers: [GradebookService],
  exports: [GradebookService],
})
export class GradebookModule {}
