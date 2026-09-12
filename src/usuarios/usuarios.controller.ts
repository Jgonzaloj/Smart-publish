import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsuariosService } from './usuarios.service';
import { JwtPayload } from '../auth/jwt.strategy';
import {
  CrearUsuarioDto,
  ActualizarUsuarioDto,
  CambiarPasswordDto,
  CambiarPinDto,
  AlternarEstadoDto,
  RolUsuario,
} from './dto/usuarios.dto';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN') // Este controlador es exclusivo para la administración de la empresa
export class UsuariosController {
  constructor(private usuariosService: UsuariosService) {}

  /**
   * Obtiene la lista completa de miembros del equipo (Admins y Vendedores).
   * Opcionalmente filtra por rol: ?rol=ADMIN o ?rol=VENDEDOR
   */
  @Get()
  listar(
    @CurrentUser() user: JwtPayload,
    @Query('rol') filtroRol?: RolUsuario,
  ) {
    return this.usuariosService.listar(user, filtroRol);
  }

  /**
   * Crea un nuevo usuario en la plataforma (ADMIN o VENDEDOR).
   */
  @Post()
  crearUsuario(
    @Body(new ValidationPipe({ whitelist: true })) dto: CrearUsuarioDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usuariosService.crearUsuario(user, dto);
  }

  /**
   * Obtiene los detalles de un usuario específico.
   */
  @Get(':id')
  obtenerPorId(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usuariosService.obtenerPorId(id, user);
  }

  /**
   * Actualiza la información de un usuario (nombre, teléfono, posición, rol).
   */
  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: ActualizarUsuarioDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usuariosService.actualizarUsuario(id, user, dto);
  }

  /**
   * Activa o suspende el acceso de un usuario.
   */
  @Patch(':id/estado')
  alternarEstado(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: AlternarEstadoDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usuariosService.alternarEstado(id, user, dto.activo);
  }

  /**
   * Restablece la contraseña de acceso de un miembro del equipo.
   */
  @Patch(':id/password')
  cambiarPassword(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: CambiarPasswordDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usuariosService.cambiarPassword(id, user, dto.password);
  }

  /**
   * Restablece el PIN de seguridad de la aplicación móvil para el usuario.
   */
  @Patch(':id/pin')
  cambiarPin(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: CambiarPinDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usuariosService.cambiarPin(id, user, dto.pin);
  }

  /**
   * Elimina un usuario sólo si no tiene transacciones en el historial contable.
   */
  @Delete(':id')
  eliminarUsuario(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usuariosService.eliminarUsuario(id, user);
  }

  // ==========================================
  // ENDPOINTS DE RETROCOMPATIBILIDAD
  // ==========================================

  @Post('vendedores')
  crearVendedor(
    @Body() body: { nombre: string; email: string; password: string; posicion?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usuariosService.crearVendedor(user, body.nombre, body.email, body.password, body.posicion);
  }

  @Get('vendedores')
  listarVendedores(@CurrentUser() user: JwtPayload) {
    return this.usuariosService.listar(user, RolUsuario.VENDEDOR);
  }

  @Patch('vendedores/:id/desactivar')
  desactivar(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usuariosService.desactivar(id, user);
  }
}
