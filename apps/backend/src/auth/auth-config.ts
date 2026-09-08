import { SignOptions } from 'jsonwebtoken';

export function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Falta JWT_ACCESS_SECRET o JWT_SECRET en las variables de entorno.');
  }
  return secret;
}

export function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Falta JWT_REFRESH_SECRET o JWT_SECRET en las variables de entorno.');
  }
  return secret;
}

export function getAccessExpiresIn(): SignOptions['expiresIn'] {
  return (process.env.JWT_ACCESS_EXPIRES_IN ?? process.env.JWT_EXPIRES_IN ?? '15m') as SignOptions['expiresIn'];
}

export function getRefreshExpiresIn(): SignOptions['expiresIn'] {
  return (process.env.JWT_REFRESH_EXPIRES_IN ?? process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];
}