import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AdminAndTeacherGuard } from './admin_and_teacher.guard';
import { OrganizationService } from 'src/organization/organization.service';
import type { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class MultiTenancyGuard extends AdminAndTeacherGuard {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly orgService: OrganizationService,
    reflector: Reflector,
  ) {
    super(reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const parentCanActivate = await super.canActivate(context);
    if (!parentCanActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    let orgId: string = request.headers['x-org-id'];

    if (!orgId) {
      const defaultOrg = await this.orgService.getDefaultOrganization();
      orgId = defaultOrg.id;
    }

    if (!user || !user.userId) {
      throw new UnauthorizedException('User not found in request');
    }

    // user.userId — это mongoId (строка), OrgMember.userId — Int (User.id)
    // Ищем пользователя по mongoId, чтобы получить Int id
    const userRecord = await this.prisma.user.findUnique({
      where: { mongoId: user.userId },
      select: { id: true },
    });

    if (!userRecord) {
      throw new UnauthorizedException('User not found in database');
    }

    const isMember = await this.orgService.isMember(orgId, userRecord.id);

    if (!isMember) {
      throw new ForbiddenException(`You are not a member of this organization`);
    }

    request.currentOrgId = orgId;

    return true;
  }
}
