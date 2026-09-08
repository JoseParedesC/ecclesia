import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GlobalRole } from '@prisma/client';
import { SUPER_ADMIN_KEY } from '../decorators/super-admin.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresSuperAdmin = this.reflector.getAllAndOverride<boolean>(SUPER_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiresSuperAdmin) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (user?.globalRole !== GlobalRole.SUPER_ADMIN) {
      throw new ForbiddenException('Solo el Super Admin puede realizar esta acción.');
    }
    return true;
  }
}
