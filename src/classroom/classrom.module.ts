import { forwardRef, Module } from '@nestjs/common';
import { ClassroomService } from './service/classroom.service';
import { ClassroomController } from './controllers/classroom.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from './schemas/course.schema';
import { UsersModule } from '../users/users.module'; // ИСПОЛЬЗУЙТЕ ../ ВМЕСТО src/
import { UserTgModule } from '../users_tg/user_tg.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => UserTgModule),
    MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }]),
  ],
  providers: [ClassroomService],
  controllers: [ClassroomController],
  exports: [ClassroomService],
})
export class ClassroomModule {}
