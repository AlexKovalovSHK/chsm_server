import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EnrollmentController } from './controllers/enrollment.controller';
import { EnrollmentService } from './service/enrollment.service';
import { EnrollmentControllerV2 } from './controllers/enrollment.controller_v2';

@Module({
  imports: [PrismaModule],
  controllers: [EnrollmentController, EnrollmentControllerV2],
  providers: [EnrollmentService],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
