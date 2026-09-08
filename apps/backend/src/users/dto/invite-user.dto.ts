import { IsEmail, IsEnum, IsString } from 'class-validator';
import { TenantRole } from '@prisma/client';

export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsEnum(TenantRole)
  role: TenantRole;
}
