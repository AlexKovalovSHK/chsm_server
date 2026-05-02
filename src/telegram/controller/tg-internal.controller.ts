//tg-internal.controller.ts

import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { UserService } from '../../users/application/user.service';
import { TgInternalService } from '../service/tg-internal.service';
import { BotApiService } from '../service/bot-api.service';
import { NewUserTgDto } from 'src/users/application/dto/new-user-tg.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('internal/users')
export class TgInternalController {
    constructor(
        private readonly tgInternalService: TgInternalService,
        private readonly userService: UserService,
        private readonly botApiService: BotApiService,
    ) { }

    @Post('upsert')
    async upsert(@Body() data: any) {
        return await this.tgInternalService.upsertFromTelegram(data);
    }

    @Get('by-tg/:tgId')
    async getByTg(@Param('tgId') tgId: string) {
        // Используем уже существующий метод в UserService
        return await this.userService.findByTgId(tgId);
    }

    @Patch('sync')
    async sync(@Body() dto: NewUserTgDto) {
        return await this.tgInternalService.syncUserData(dto);
    }

    @Patch('registration-step')
    async updateStep(@Body() dto: { tgId: string; step: string }) {
        return await this.tgInternalService.updateRegistrationStep(dto.tgId, dto.step);
    }

    @Patch('link-email')
    async linkEmail(@Body() dto: { tgId: string; email: string }) {
        return await this.tgInternalService.linkEmail(dto.tgId, dto.email);
    }

    @Patch('mark-blocked')
    async markBlocked(@Body() dto: { tgId: string }) {
        return await this.tgInternalService.markAsBlocked(dto.tgId);
    }

    @Post('send-message')
    @UseGuards(JwtAuthGuard)
    async sendMessageToUser(@Body() dto: { tgId: string; text: string }) {
        return await this.botApiService.sendMessage(dto.tgId, dto.text);
    }

    @Post('broadcast')
    async broadcast(
        @Body() dto: { users: string[]; text: string }
    ) {
        const results = { sent: 0, failed: 0 };

        for (const tgId of dto.users) {
            try {
                await this.botApiService.sendMessage(tgId, dto.text);
                results.sent++;
            } catch (e) {
                results.failed++;
            }
        }

        return { success: true, results };
    }

    @Post('broadcast-extension')
    async broadcastExtension(
        @Body() dto: { users: string[]; text: string }
    ) {
        const results = {
            sent: 0,
            failed: 0,
            missingUsers: [] as string[],
            missingTgIds: [] as string[],
        };

        for (const email of dto.users) {
            try {
                const user = await this.userService.findByEmail(email.toLowerCase().trim());

                if (!user) {
                    results.missingUsers.push(email);
                    results.failed++;
                    continue;
                }

                if (!user.tgId) {
                    results.missingTgIds.push(email);
                    results.failed++;
                    continue;
                }

                await this.botApiService.sendMessage(user.tgId, dto.text);
                results.sent++;
            } catch (e) {
                results.failed++;
            }
        }

        return { success: true, results };
    }
}