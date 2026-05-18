import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from './application/user.service';
import { UserController } from './controllers/user.controller';
import { ClassroomModule } from '../classroom/classrom.module';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { TelegramModule } from '../telegram/tg.module';
import { OrganizationModule } from '../organization/organization.module';
import { MultiTenancyGuard } from 'src/auth/guards/multi-tenancy.guard';

@Module({
  imports: [
    forwardRef(() => ClassroomModule),
    forwardRef(() => TelegramModule),
    OrganizationModule,
    JwtModule.register({}),
  ],
  providers: [
    UserService,
    {
      provide: 'IUserRepository',
      useClass: PrismaUserRepository,
    },
    MultiTenancyGuard,
  ],
  exports: [UserService, 'IUserRepository'],
  controllers: [UserController],
})
export class UsersModule {}
