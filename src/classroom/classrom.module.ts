import { forwardRef, Module } from '@nestjs/common';
import { ClassroomService } from './service/classroom.service';
import { ClassroomController } from './controllers/classroom.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from './schemas/course.schema';
import { UsersModule } from '../users/users.module'; // ИСПОЛЬЗУЙТЕ ../ ВМЕСТО src/
import { User } from '../users/domain/user.entity';
import { UserSchema } from '../users/infrastructure/user.document';
import { GoogleAuth, GoogleAuthSchema } from './classroomAuth/google-auth.schema';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([{ name: GoogleAuth.name, schema: GoogleAuthSchema }]),
    MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [ClassroomService],
  controllers: [ClassroomController],
  exports: [ClassroomService],
})
export class ClassroomModule {}
