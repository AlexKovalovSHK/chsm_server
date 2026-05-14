import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class AdminAndTeacherGuard extends JwtAuthGuard {
  private readonly roleReflector: Reflector;

  static readonly DEFAULT_ROLES = ['admin', 'teacher'];

  constructor(reflector: Reflector) {
    super(reflector);
    this.roleReflector = reflector;
  }

  canActivate(context: ExecutionContext): Promise<boolean> {
    return (async () => {
      // Step 1: Check if the route is marked as @Public()
      const isPublic = this.roleReflector.getAllAndOverride<boolean>(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (isPublic) {
        return true;
      }

      // Step 2: Perform JWT authentication via parent guard
      const isAuthenticated = await super.canActivate(context);
      if (!isAuthenticated) {
        return false;
      }

      // Step 3: Check roles
      const request = context
        .switchToHttp()
        .getRequest<{ user: { role: string } }>();
      const user = request.user;

      if (!user || !user.role) {
        throw new ForbiddenException('Доступ запрещён: роль не определена');
      }

      // Если на контроллере/методе указан @Roles() — используем его,
      // иначе — стандартные роли (admin, teacher)
      const allowedRoles =
        this.roleReflector.getAllAndOverride<string[]>(ROLES_KEY, [
          context.getHandler(),
          context.getClass(),
        ]) ?? AdminAndTeacherGuard.DEFAULT_ROLES;

      if (!allowedRoles.includes(user.role)) {
        throw new ForbiddenException(
          `Доступ запрещён: требуется роль ${allowedRoles.join(' или ')}, текущая роль — ${user.role}`,
        );
      }

      return true;
    })();
  }
}
