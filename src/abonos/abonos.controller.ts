import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AbonosService } from './abonos.service';
import { CrearAbonoDto } from './dto/crear-abono.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('abonos')
@UseGuards(JwtAuthGuard)
export class AbonosController {
  constructor(private abonosService: AbonosService) {}

  @Post()
  crear(@Body() dto: CrearAbonoDto, @CurrentUser() user: JwtPayload) {
    return this.abonosService.crear(dto, user);
  }

  @Get('credito/:creditoId')
  listarPorCredito(@Param('creditoId') creditoId: string, @CurrentUser() user: JwtPayload) {
    return this.abonosService.listarPorCredito(creditoId, user);
  }

  @Get('credito/:creditoId/extracto')
  obtenerExtracto(@Param('creditoId') creditoId: string, @CurrentUser() user: JwtPayload) {
    return this.abonosService.obtenerExtractoCredito(creditoId, user);
  }
}
