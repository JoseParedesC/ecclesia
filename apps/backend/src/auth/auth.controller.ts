import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SelectTenantDto } from './dto/select-tenant.dto';
import { AuthenticatedUser } from './types/authenticated-user.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Inicia el flujo de OAuth de Google (redirige a Google)
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport intercepta esta ruta y redirige; no se ejecuta cuerpo.
  }

  // Callback que Google invoca tras el login
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.loginWithGoogle(req.user);

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

    if ('requiresTenantSelection' in result) {
      const params = new URLSearchParams({
        pendingToken: result.pendingToken,
        tenants: JSON.stringify(result.availableTenants),
      });
      return res.redirect(`${frontendUrl}/login/select-tenant?${params.toString()}`);
    }

    const params = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    return res.redirect(`${frontendUrl}/login/callback?${params.toString()}`);
  }

  // Cuando el usuario pertenece a varias iglesias, elige una con el pendingToken
  @Post('select-tenant')
  async selectTenant(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SelectTenantDto,
  ) {
    return this.authService.selectTenant(user.userId, dto.tenantId);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  async logout() {
    // Con JWT stateless no hay estado de sesión que invalidar server-side
    // en el MVP; el frontend descarta los tokens. Si se requiere revocación
    // real, agregar una tabla de refresh tokens con estado.
    return { success: true };
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
