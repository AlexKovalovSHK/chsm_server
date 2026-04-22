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

  @Cron(CronExpression.EVERY_30_MINUTES)
  async syncClassroomData() {
    this.logger.log('--- Запуск синхронизации Classroom ---');

    // Используем метод, который мы написали ранее (назовем его findAllForSync)
    const users = await this.userService.findAllForSync();

    // src/sync/sync.service.ts

    for (const user of users) {
      try {
        const tokens = user.googleTokens;
        const courses = await this.classroomService.getAllCourses(tokens);

        const newTasksFound: any[] = [];

        // 1. Используем .lastSeenTaskIds (теперь TS его увидит)
        // Добавляем проверку на случай, если поле вдруг undefined
        const currentSeenIds = user.lastSeenTaskIds || [];
        const updatedTaskIds = [...currentSeenIds];

        for (const course of courses) {
          const coursework = await this.classroomService.getAssignments(
            tokens,
            course.id!,
          );

          for (const work of coursework) {
            if (work.id && !currentSeenIds.includes(work.id)) {
              newTasksFound.push({
                courseName: course.name,
                title: work.title,
                link: work.alternateLink,
              });
              updatedTaskIds.push(work.id);
            }
          }
        }

        if (newTasksFound.length > 0) {
          this.logger.log(
            `Найдено ${newTasksFound.length} новых заданий для ${user.email}`,
          );

          await this.botService.sendNewTasksNotification(
            user.tgId,
            newTasksFound,
          );

          // 2. ИСПРАВЛЕНИЕ ОШИБКИ ID:
          // Вместо user._id as string используйте user.id (это готовая строка)
          // Или (user._id as any).toString()
          await this.userService.update(user.id, {
            lastSeenTaskIds: updatedTaskIds,
          });
        }
      } catch (e) {
        this.logger.error(
          `Ошибка синхронизации для пользователя ${user.email}: ${e.message}`,
        );
      }
    }
  }
}
