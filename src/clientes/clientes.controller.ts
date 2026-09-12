import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ClientesService } from './clientes.service';
import { CrearClienteDto, RenovarCreditoDto } from './dto/crear-cliente.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('clientes')
@UseGuards(JwtAuthGuard) // requiere login; admin y vendedor pueden usar estos endpoints
export class ClientesController {
  constructor(private clientesService: ClientesService) {}

  @Post()
  crear(@Body() dto: CrearClienteDto, @CurrentUser() user: JwtPayload) {
    return this.clientesService.crear(dto, user);
  }

  @Post('creditos/renovar')
  renovarCredito(@Body() dto: RenovarCreditoDto, @CurrentUser() user: JwtPayload) {
    return this.clientesService.renovarCredito(dto, user);
  }

  @Get()
  listar(@CurrentUser() user: JwtPayload) {
    return this.clientesService.listar(user);
  }

  @Get(':id')
  obtener(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.clientesService.obtener(id, user);
  }
}
