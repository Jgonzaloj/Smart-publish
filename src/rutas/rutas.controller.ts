import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RutasService } from './rutas.service';
import {
  ActualizarOrdenRutaDto,
  CambiarEstadoVisitaDto,
  ConsultaRutaDto,
  MarcarAusenteDto,
} from './dto/rutas.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('rutas')
@UseGuards(JwtAuthGuard)
export class RutasController {
  constructor(private rutasService: RutasService) {}

  /**
   * Hoja de ruta del día: lista ordenada de clientes, cuota a cobrar,
   * saldo, cuotas atrasadas, estado de visita e indicador de pago de hoy.
   */
  @Get('hoy')
  obtenerRutaHoy(@Query() query: ConsultaRutaDto, @CurrentUser() user: JwtPayload) {
    return this.rutasService.obtenerRutaHoy(user, query);
  }

  /**
   * Marca a un cliente como AUSENTE durante la visita del día.
   */
  @Patch('clientes/:clienteId/ausente')
  marcarAusente(
    @Param('clienteId') clienteId: string,
    @Body() dto: MarcarAusenteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rutasService.marcarAusente(clienteId, user, dto);
  }

  /**
   * Actualiza el estado de visita de un cliente (AL_DIA, ATRASADO, AUSENTE).
   */
  @Patch('clientes/:clienteId/estado')
  cambiarEstadoVisita(
    @Param('clienteId') clienteId: string,
    @Body() dto: CambiarEstadoVisitaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rutasService.cambiarEstadoVisita(clienteId, dto, user);
  }

  /**
   * Marca a un cliente como APLAZADO (siguiente día).
   */
  @Patch('clientes/:clienteId/aplazar')
  marcarAplazado(
    @Param('clienteId') clienteId: string,
    @Body() dto: MarcarAusenteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rutasService.cambiarEstadoVisita(clienteId, { estadoVisita: 'APLAZADO', observaciones: dto?.observaciones }, user);
  }

  /**
   * Guarda o actualiza el orden manual de visitas de la ruta.
   */
  @Put('orden')
  actualizarOrden(@Body() dto: ActualizarOrdenRutaDto, @CurrentUser() user: JwtPayload) {
    return this.rutasService.actualizarOrdenRuta(dto, user);
  }
}
