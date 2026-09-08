import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(3)
  slug: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  // Email del primer administrador de la iglesia (se invita automáticamente)
  @IsEmail()
  adminEmail: string;

  @IsString()
  adminFullName: string;
}
