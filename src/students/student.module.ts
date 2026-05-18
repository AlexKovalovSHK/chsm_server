import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StudentController } from './interface/http/student.controller';
import { StudentService } from './application/student.service';
import { IStudentRepository } from './domain/repositories/student.repository.interface';
import { PrismaStudentRepository } from './infrastructure/persistence/prisma-student.repository';
import { StudentControllerV2 } from './interface/http/student.controller_v2';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';
import { OrganizationModule } from 'src/organization/organization.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, OrganizationModule, JwtModule.register({})],
  controllers: [StudentController, StudentControllerV2],
  providers: [
    StudentService,
    {
      provide: IStudentRepository,
      useClass: PrismaStudentRepository,
    },
    MultiTenancyGuard,
  ],
  exports: [StudentService],
})
export class StudentModule {}
