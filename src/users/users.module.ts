import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { ClassroomModule } from '../classroom/classrom.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => ClassroomModule),
  ],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UsersModule {}
