import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CajaService } from './caja.service';
import { CrearMovimientoDto, RetiroCajaDto, CerrarCuadreDto, SetCajaInicialDto, MovimientoSeguroDto } from './dto/caja.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('caja')
@UseGuards(JwtAuthGuard)
export class CajaController {
  constructor(private cajaService: CajaService) {}

  // ---- Skill 10: ingresos y egresos ----

  @Post('movimientos')
  registrarMovimiento(@Body() dto: CrearMovimientoDto, @CurrentUser() user: JwtPayload) {
    return this.cajaService.registrarMovimiento(dto, user);
  }

  @Get('movimientos')
  listarMovimientos(@Query('fecha') fecha: string | undefined, @CurrentUser() user: JwtPayload) {
    return this.cajaService.listarMovimientos(user, fecha);
  }

  // ---- Skill 16: retiro de caja ----

  @Post('retiro')
  registrarRetiro(@Body() dto: RetiroCajaDto, @CurrentUser() user: JwtPayload) {
    return this.cajaService.registrarRetiro(dto, user);
  }

  // ---- Resumen del Día estilo V13 ----

  @Get('resumen-dia')
  obtenerResumenDia(
    @Query('fecha') fecha: string | undefined,
    @Query('vendedorId') vendedorId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.cajaService.obtenerResumenDia(user, fecha, vendedorId);
  }

  @Post('caja-inicial')
  setCajaInicial(@Body() dto: SetCajaInicialDto, @CurrentUser() user: JwtPayload) {
    return this.cajaService.setCajaInicial(dto, user);
  }

  @Post('movimiento-seguro')
  registrarMovimientoSeguro(@Body() dto: MovimientoSeguroDto, @CurrentUser() user: JwtPayload) {
    return this.cajaService.registrarMovimientoSeguro(dto, user);
  }

  // ---- Skill 6: cuadre de caja ----

  @Get('cuadre/hoy')
  obtenerCuadreDia(@Query('fecha') fecha: string | undefined, @CurrentUser() user: JwtPayload) {
    return this.cajaService.obtenerCuadreDia(user, fecha);
  }

  @Post('cuadre/cerrar')
  cerrarCuadre(@Body() dto: CerrarCuadreDto, @CurrentUser() user: JwtPayload) {
    return this.cajaService.cerrarCuadre(dto, user);
  }

  @Get('cuadre/resumen-admin')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  resumenAdmin(@Query('fecha') fecha: string | undefined, @CurrentUser() user: JwtPayload) {
    return this.cajaService.resumenAdmin(user, fecha);
  }
}

