import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClassroomService } from 'src/classroom/service/classroom.service';
import { BotService } from 'src/telegram/bot/bot.service';
import { UserService } from 'src/users/services/user.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    @Inject(forwardRef(() => ClassroomService))
    private classroomService: ClassroomService,
    private botService: BotService,
  ) {}

}
