import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

// Autorización por rol de TENANT. Un Super Admin sin tenantRole explícito
// definido para este tenant NO hereda automáticamente permisos financieros
// (PRD 5.1: "el acceso a información financiera de una iglesia debe estar
// explícitamente controlado") — debe operar mediante impersonación/asignación
// explícita, no por defecto.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<TenantRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user?.tenantRole || !requiredRoles.includes(user.tenantRole)) {
      throw new ForbiddenException('No tiene permisos para realizar esta acción.');
    }
    return true;
  }
}
