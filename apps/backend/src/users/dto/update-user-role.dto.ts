import { IsEnum } from 'class-validator';
import { TenantRole } from '@prisma/client';

export class UpdateUserRoleDto {
  @IsEnum(TenantRole)
  role: TenantRole;
}
