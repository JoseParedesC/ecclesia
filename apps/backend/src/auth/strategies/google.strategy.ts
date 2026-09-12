import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';

// Solo obtiene la identidad de Google (email, nombre, foto, googleId).
// La resolución de tenant/rol ocurre en AuthService, NO aquí.
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientSecret) {
      throw new Error('Falta GOOGLE_CLIENT_SECRET en apps/backend/.env.');
    }

    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret,
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? '',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { id, name, emails, photos } = profile;
    const googleUser = {
      googleId: id,
      email: emails?.[0]?.value,
      fullName: `${name?.givenName ?? ''} ${name?.familyName ?? ''}`.trim(),
      avatarUrl: photos?.[0]?.value,
    };
    done(null, googleUser);
  }
}
