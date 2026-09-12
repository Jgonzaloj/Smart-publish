import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN') // El dashboard ejecutivo con métricas financieras globales es exclusivo para Administradores
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('resumen')
  obtenerResumen(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.obtenerResumenEjecutivo(user);
  }
}
