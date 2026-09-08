import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
// Marca un endpoint como público (sin JWT). Uso: /auth/login, /auth/google, /auth/refresh
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
