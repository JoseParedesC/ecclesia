import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GlobalRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from './types/authenticated-user.type';
import { NoActiveTenantException } from '../common/exceptions/domain.exception';

interface GoogleUserPayload {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // Login/registro por Google. Si el email ya existe (invitado previamente
  // por un Admin de Iglesia sin googleId), se vincula la cuenta de Google.
  async loginWithGoogle(googleUser: GoogleUserPayload) {
    let user = await this.prisma.user.findUnique({ where: { email: googleUser.email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          fullName: googleUser.fullName,
          googleId: googleUser.googleId,
          avatarUrl: googleUser.avatarUrl,
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.googleId, avatarUrl: googleUser.avatarUrl },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado. Contacte al administrador.');
    }

    const memberships = await this.prisma.userTenant.findMany({
      where: { userId: user.id, isActive: true },
      include: { tenant: true },
    });

    // Super Admin sin tenants: token "sin tenant" que solo sirve para rutas /super-admin/*
    if (memberships.length === 0 && user.globalRole === GlobalRole.SUPER_ADMIN) {
      return this.issueTokens({
        userId: user.id,
        email: user.email,
        globalRole: user.globalRole,
        tenantId: null,
        tenantRole: null,
      });
    }

    if (memberships.length === 0) {
      throw new UnauthorizedException(
        'Este usuario no pertenece a ninguna iglesia. Solicite una invitación.',
      );
    }

    // Un solo tenant: se emite el token directamente sobre ese tenant.
    // Varios tenants: el frontend debe llamar a /auth/select-tenant tras
    // mostrar un selector (mismo patrón que un login multi-organización).
    if (memberships.length === 1) {
      const m = memberships[0];
      return this.issueTokens({
        userId: user.id,
        email: user.email,
        globalRole: user.globalRole,
        tenantId: m.tenantId,
        tenantRole: m.role,
      });
    }

    return {
      requiresTenantSelection: true,
      availableTenants: memberships.map((m) => ({
        tenantId: m.tenantId,
        tenantName: m.tenant.name,
        role: m.role,
      })),
      // token temporal de identidad, sin tenant, corta duración, solo para /auth/select-tenant
      pendingToken: this.jwtService.sign(
        { userId: user.id, email: user.email, globalRole: user.globalRole, tenantId: null, tenantRole: null },
        { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '5m' },
      ),
    };
  }

  async selectTenant(userId: string, tenantId: string) {
    const membership = await this.prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });
    if (!membership || !membership.isActive) {
      throw new NoActiveTenantException();
    }
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    return this.issueTokens({
      userId: user.id,
      email: user.email,
      globalRole: user.globalRole,
      tenantId: membership.tenantId,
      tenantRole: membership.role,
    });
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<AuthenticatedUser>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      return this.issueTokens(payload);
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }
  }

  private issueTokens(payload: AuthenticatedUser) {
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    });
    return { accessToken, refreshToken, user: payload };
  }
}
