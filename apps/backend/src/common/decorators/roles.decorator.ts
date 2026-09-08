import { SetMetadata } from '@nestjs/common';
import { TenantRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Roles de TENANT (Admin de Iglesia / Operador / Consulta).
// Para Super Admin global se usa @SuperAdminOnly() por separado.
export const Roles = (...roles: TenantRole[]) => SetMetadata(ROLES_KEY, roles);
