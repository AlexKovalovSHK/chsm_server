import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'allowedRoles';

/**
 * Указывает, какие роли имеют доступ к контроллеру или эндпоинту.
 * Если декоратор не указан — гвард использует стандартные роли (admin, teacher).
 *
 * @example
 * ```typescript
 * @Roles('student')
 * @Roles('student', 'admin', 'teacher')
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
