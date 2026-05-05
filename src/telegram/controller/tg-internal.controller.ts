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
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Telegram internal')
@Controller('internal/users')
export class TgInternalController {
    constructor(
        private readonly tgInternalService: TgInternalService,
        private readonly userService: UserService,
        private readonly botApiService: BotApiService,
    ) { }

    @ApiOperation({ summary: 'Создать/обновить пользователя из Telegram' })
    @Post('upsert')
    async upsert(@Body() data: any) {
        return await this.tgInternalService.upsertFromTelegram(data);
    }

    @ApiOperation({ summary: 'Получить пользователя по tgId' })
    @ApiParam({ name: 'tgId' })
    @Get('by-tg/:tgId')
    async getByTg(@Param('tgId') tgId: string) {
        // Используем уже существующий метод в UserService
        return await this.userService.findByTgId(tgId);
    }

    @ApiOperation({ summary: 'Синхронизировать данные пользователя из Telegram' })
    @Patch('sync')
    async sync(@Body() dto: NewUserTgDto) {
        return await this.tgInternalService.syncUserData(dto);
    }

    @ApiOperation({ summary: 'Обновить шаг регистрации' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['tgId', 'step'],
            properties: { tgId: { type: 'string' }, step: { type: 'string' } },
        },
    })
    @Patch('registration-step')
    async updateStep(@Body() dto: { tgId: string; step: string }) {
        return await this.tgInternalService.updateRegistrationStep(dto.tgId, dto.step);
    }

    @ApiOperation({ summary: 'Привязать email к Telegram-пользователю' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['tgId', 'email'],
            properties: { tgId: { type: 'string' }, email: { type: 'string' } },
        },
    })
    @Patch('link-email')
    async linkEmail(@Body() dto: { tgId: string; email: string }) {
        return await this.tgInternalService.linkEmail(dto.tgId, dto.email);
    }

    @ApiOperation({ summary: 'Пометить пользователя как заблокированного' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['tgId'],
            properties: { tgId: { type: 'string' } },
        },
    })
    @Patch('mark-blocked')
    async markBlocked(@Body() dto: { tgId: string }) {
        return await this.tgInternalService.markAsBlocked(dto.tgId);
    }

    @ApiOperation({ summary: 'Отправить сообщение пользователю в Telegram' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['tgId', 'text'],
            properties: { tgId: { type: 'string' }, text: { type: 'string' } },
        },
    })
    @Post('send-message')
    @UseGuards(JwtAuthGuard)
    async sendMessageToUser(@Body() dto: { tgId: string; text: string }) {
        return await this.botApiService.sendMessage(dto.tgId, dto.text);
    }

    @ApiOperation({ summary: 'Рассылка в Telegram по tgId' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['users', 'text'],
            properties: {
                users: { type: 'array', items: { type: 'string' } },
                text: { type: 'string' },
            },
        },
    })
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

    @ApiOperation({ summary: 'Рассылка в Telegram по email (через поиск tgId)' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['users', 'text'],
            properties: {
                users: { type: 'array', items: { type: 'string' } },
                text: { type: 'string' },
            },
        },
    })
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