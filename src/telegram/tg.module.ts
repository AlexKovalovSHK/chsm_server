import { forwardRef, Module } from '@nestjs/common';
import { TgInternalService } from './service/tg-internal.service';
import { TgInternalController } from './controller/tg-internal.controller';
import { BotApiService } from './service/bot-api.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [TgInternalService, BotApiService],
  exports: [TgInternalService, BotApiService],
  controllers: [TgInternalController],
})
export class TelegramModule {}
