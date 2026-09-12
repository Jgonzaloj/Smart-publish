import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MoraService } from './mora.service';
import { EjecutarMoraDto } from './dto/mora.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('mora')
@UseGuards(JwtAuthGuard)
export class MoraController {
  constructor(private moraService: MoraService) {}

  /**
   * Ejecuta el recálculo de mora para todos los créditos del tenant.
   * Útil para pruebas, cierres o sincronizaciones manuales.
   * Solo accesible por el rol ADMIN.
   */
  @Post('ejecutar')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  ejecutarMora(@Body() dto: EjecutarMoraDto, @CurrentUser() user: JwtPayload) {
    return this.moraService.ejecutarParaTenant(user.tenantId, dto.fechaReferencia);
  }
}
