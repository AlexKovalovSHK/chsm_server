import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './application/user.service';
import { UserController } from './controllers/user.controller';
import { ClassroomModule } from '../classroom/classrom.module';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { TelegramModule } from '../telegram/tg.module';

@Module({

  imports: [
    forwardRef(() => ClassroomModule),
    forwardRef(() => TelegramModule),
  ],
  providers: [
    UserService,
    {
      provide: 'IUserRepository',
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UserService],
  controllers: [UserController],
})
export class UsersModule {}
