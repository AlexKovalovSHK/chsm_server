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
    // @UseGuards(JwtAuthGuard, RolesGuard) // ОБЯЗАТЕЛЬНО: только для админов
    async sendMessageToUser(@Body() dto: { tgId: string; text: string }) {
        return await this.botApiService.sendMessage(dto.tgId, dto.text);
    }

}