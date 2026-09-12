import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { NoActiveTenantException } from '../exceptions/domain.exception';

// AuthenticatedUser.tenantId es `string | null` porque un Super Admin puede
// no tener tenant activo. Los endpoints de negocio (eventos, donaciones,
// ingresos, egresos, etc.) SIEMPRE requieren un tenant — este helper hace
// ese estrechamiento de tipo explícito en un solo lugar, en vez de repetir
// "as string" o comprobaciones sueltas en cada controller.
export function requireTenantId(user: AuthenticatedUser): string {
  if (!user.tenantId) {
    throw new NoActiveTenantException();
  }
  return user.tenantId;
}
