import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StudentController } from './interface/http/student.controller';
import { StudentService } from './application/student.service';
import { IStudentRepository } from './domain/repositories/student.repository.interface';
import { PrismaStudentRepository } from './infrastructure/persistence/prisma-student.repository';
import { StudentControllerV2 } from './interface/http/student.controller_v2';

@Module({
  imports: [PrismaModule],
  controllers: [StudentController, StudentControllerV2],
  providers: [
    StudentService,
    {
      provide: IStudentRepository,
      useClass: PrismaStudentRepository,
    },
  ],
  exports: [StudentService],
})
export class StudentModule {}
