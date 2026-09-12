import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../types/authenticated-user.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    });
  }

  // El payload ya fue firmado por AuthService con tenantId/tenantRole
  // resueltos server-side; aquí solo lo validamos y lo exponemos como
  // request.user para el resto de la app (guards, controllers, servicios).
  validate(payload: AuthenticatedUser): AuthenticatedUser {
    if (!payload?.userId) {
      throw new UnauthorizedException('Token inválido.');
    }
    return payload;
  }
}
