import { forwardRef, Module } from '@nestjs/common';
import { ClassroomService } from './service/classroom.service';
import { ClassroomController } from './controllers/classroom.controller';
import { GoogleAuthService } from './service/google-auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
  ],
  providers: [ClassroomService, GoogleAuthService],
  controllers: [ClassroomController],
  exports: [ClassroomService, GoogleAuthService],
})
export class ClassroomModule {}
