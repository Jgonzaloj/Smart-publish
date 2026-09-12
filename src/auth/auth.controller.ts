import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('registro-negocio')
  registrarNegocio(
    @Body()
    body: {
      nombreNegocio: string;
      adminNombre: string;
      email: string;
      password: string;
      moneda?: string;
      pais?: string;
    },
  ) {
    return this.authService.registrarNegocio(
      body.nombreNegocio,
      body.adminNombre,
      body.email,
      body.password,
      body.moneda,
      body.pais,
    );
  }

  @Patch('tenant/moneda')
  @UseGuards(JwtAuthGuard)
  actualizarMoneda(
    @Body('moneda') moneda: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.authService.actualizarMonedaTenant(user.tenantId, moneda);
  }

  @Post('pin/configurar')
  @UseGuards(JwtAuthGuard)
  configurarPin(@Body('pin') pin: string, @CurrentUser() user: JwtPayload) {
    return this.authService.configurarPin(user.sub, user.tenantId, pin);
  }

  @Post('pin/verificar')
  @UseGuards(JwtAuthGuard)
  verificarPin(@Body('pin') pin: string, @CurrentUser() user: JwtPayload) {
    return this.authService.verificarPin(user.sub, user.tenantId, pin);
  }
}
