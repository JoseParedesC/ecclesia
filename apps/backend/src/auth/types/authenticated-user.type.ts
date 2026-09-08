import { GlobalRole, TenantRole } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';

// Payload que viaja en el JWT y que el JwtStrategy adjunta a request.user.
// El tenantId SIEMPRE viene del token (emitido por el backend en /auth/login
// o /auth/select-tenant), NUNCA del body/query enviado por el cliente.
export interface AuthenticatedUser {
  userId: string;
  email: string;
  globalRole: GlobalRole;
  // Tenant "activo" de la sesión actual (un usuario puede pertenecer a varios,
  // pero opera sobre uno a la vez). Null solo para Super Admin sin tenant.
  tenantId: string | null;
  tenantRole: TenantRole | null;
}

export function requireTenantId(user: AuthenticatedUser): string {
  if (!user.tenantId) {
    throw new UnauthorizedException('La sesión no tiene una iglesia activa.');
  }
  return user.tenantId;
}
