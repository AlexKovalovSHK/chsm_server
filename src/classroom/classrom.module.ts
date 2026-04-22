import { forwardRef, Module } from '@nestjs/common';
import { ClassroomService } from './service/classroom.service';
import { ClassroomController } from './controllers/classroom.controller';
import { UsersModule } from 'src/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from './schemas/course.schema';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }]),
  ],
  providers: [ClassroomService],
  controllers: [ClassroomController],
  exports: [ClassroomService],
})
export class ClassroomModule {}
