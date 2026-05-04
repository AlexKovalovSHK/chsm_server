import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './application/user.service';
import { UserController } from './controllers/user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserDocument, UserSchema } from './infrastructure/user.document';
import { ClassroomModule } from '../classroom/classrom.module';
import { MongooseUserRepository } from './infrastructure/mongoose-user.repository';
import { TelegramModule } from '../telegram/tg.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserDocument.name, schema: UserSchema }]),
    forwardRef(() => ClassroomModule),
    forwardRef(() => TelegramModule),
  ],
  providers: [
    UserService,
    {
      provide: 'IUserRepository',
      useClass: MongooseUserRepository,
    },
  ],
  exports: [UserService],
  controllers: [UserController],
})
export class UsersModule {}
