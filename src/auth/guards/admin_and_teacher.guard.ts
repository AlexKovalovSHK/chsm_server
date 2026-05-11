import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AdminAndTeacherGuard extends JwtAuthGuard {
  private readonly roleReflector: Reflector;

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

      // Step 3: Check that the user has role 'admin' or 'teacher'
      const request = context
        .switchToHttp()
        .getRequest<{ user: { role: string } }>();
      const user = request.user;

      if (!user || !user.role) {
        throw new ForbiddenException('Доступ запрещён: роль не определена');
      }

      const allowedRoles = ['admin', 'teacher'];
      if (!allowedRoles.includes(user.role)) {
        throw new ForbiddenException(
          `Доступ запрещён: требуется роль admin или teacher, текущая роль — ${user.role}`,
        );
      }

      return true;
    })();
  }
}
