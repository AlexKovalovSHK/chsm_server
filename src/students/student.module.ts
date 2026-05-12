import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StudentController } from './interface/http/student.controller';
import { StudentService } from './application/student.service';
import { IStudentRepository } from './domain/repositories/student.repository.interface';
import { PrismaStudentRepository } from './infrastructure/persistence/prisma-student.repository';

@Module({
  imports: [PrismaModule],
  controllers: [StudentController],
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
