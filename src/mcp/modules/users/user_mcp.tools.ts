import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '../../decorators';
import { UserService } from '../../../users/application/user.service';
import { z } from 'zod';

@Injectable()
export class UserMcpTool {
  private readonly logger = new Logger(UserMcpTool.name);

  constructor(private readonly userService: UserService) {}

  @Tool({
    name: 'list-users',
    description:
      'Get a list of all users. Can be filtered by role, status, or search query.',
    parameters: z.object({
      role: z
        .string()
        .optional()
        .describe('Filter by role (e.g., admin, teacher, student)'),
      status: z
        .string()
        .optional()
        .describe('Filter by status (e.g., active, archived)'),
      search: z
        .string()
        .optional()
        .describe('Search by name, email, or username'),
    }),
  })
  async listUsers(filters: {
    role?: string;
    status?: string;
    search?: string;
  }) {
    try {
      this.logger.debug(
        `MCP list-users with filters: ${JSON.stringify(filters)}`,
      );
      const users = await this.userService.findAll(filters);
      return users.map((user) => user.toJSON());
    } catch (err: any) {
      this.logger.error(`Error listing users: ${err.message}`);
      return { error: err.message };
    }
  }

  @Tool({
    name: 'get-user-by-id',
    description: 'Get detailed information about a user by their unique ID.',
    parameters: z.object({
      userId: z
        .string()
        .describe('The unique ID of the user (ObjectId hex string)'),
    }),
  })
  async getUserById({ userId }: { userId: string }) {
    try {
      this.logger.debug(`MCP get-user-by-id: ${userId}`);
      const user = await this.userService.findById(userId);
      return user ? user.toJSON() : { error: 'User not found' };
    } catch (err: any) {
      this.logger.error(`Error getting user ${userId}: ${err.message}`);
      return { error: err.message };
    }
  }

  @Tool({
    name: 'find-user-by-email',
    description: 'Find a user by their email address.',
    parameters: z.object({
      email: z.string().email().describe('The email address of the user'),
    }),
  })
  async findUserByEmail({ email }: { email: string }) {
    try {
      this.logger.debug(`MCP find-user-by-email: ${email}`);
      const user = await this.userService.findByEmail(email);
      return user ? user.toJSON() : { error: 'User not found' };
    } catch (err: any) {
      this.logger.error(`Error finding user by email ${email}: ${err.message}`);
      return { error: err.message };
    }
  }

  @Tool({
    name: 'find-user-by-tg-id',
    description: 'Find a user by their Telegram ID.',
    parameters: z.object({
      tgId: z.string().describe('The Telegram ID of the user'),
    }),
  })
  async findUserByTgId({ tgId }: { tgId: string }) {
    try {
      this.logger.debug(`MCP find-user-by-tg-id: ${tgId}`);
      const user = await this.userService.findByTgId(tgId);
      return user ? user.toJSON() : { error: 'User not found' };
    } catch (err: any) {
      this.logger.error(
        `Error finding user by Telegram ID ${tgId}: ${err.message}`,
      );
      return { error: err.message };
    }
  }
}
