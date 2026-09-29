import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearClienteDto } from './dto/crear-cliente.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  /** Genera un código de crédito legible, único dentro del tenant. */
  private generarCodigoCredito(): string {
    return Math.floor(1000000 + Math.random() * 8999999).toString();
  }

  private calcularFechaVencimiento(formaPago: string, numeroCuotas: number): Date {
    const fecha = new Date();
    const dias = formaPago === 'diario' ? numeroCuotas : formaPago === 'semanal' ? numeroCuotas * 7 : numeroCuotas * 15;
    fecha.setDate(fecha.getDate() + dias);
    return fecha;
  }

  /**
   * Crea el cliente y su crédito inicial (equivalente a la pantalla "Ventas Nuevas").
   * Todo corre dentro de withTenant -> queda automáticamente aislado por RLS.
   */
  async crear(dto: CrearClienteDto, user: JwtPayload) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      let producto = dto.productoId
        ? await tx.productoCredito.findFirst({
            where: { id: dto.productoId, tenantId: user.tenantId },
          })
        : null;

      if (!producto) {
        producto = await tx.productoCredito.findFirst({
          where: { tenantId: user.tenantId, activo: true },
        });
      }

      if (!producto) {
        producto = await tx.productoCredito.create({
          data: {
            tenantId: user.tenantId,
            nombre: 'Crédito General',
            interesDefault: dto.interes || 20.0,
            activo: true,
          },
        });
      }

      const valorConInteres = dto.valorPrestamo * (1 + dto.interes / 100);
      const valorCuota = Number((valorConInteres / dto.numeroCuotas).toFixed(2));

      const vendedorIdAsignado = (user.rol === 'ADMIN' && dto.vendedorId) ? dto.vendedorId : user.sub;

      const cliente = await tx.cliente.create({
        data: {
          tenantId: user.tenantId,
          vendedorId: vendedorIdAsignado,
          documento: dto.documento,
          nombresAlias: dto.nombresAlias,
          apellidos: dto.apellidos,
          movil: dto.movil,
          telefono: dto.telefono,
          direccion: dto.direccion,
          latitud: dto.latitud ?? null,
          longitud: dto.longitud ?? null,
          precisionGps: dto.precisionGps ?? null,
        },
      });

      const credito = await tx.credito.create({
        data: {
          tenantId: user.tenantId,
          clienteId: cliente.id,
          vendedorId: vendedorIdAsignado,
          productoId: producto.id,
          codigoCredito: this.generarCodigoCredito(),
          valorPrestamo: dto.valorPrestamo,
          valorCuota,
          interes: dto.interes,
          numeroCuotasTotal: dto.numeroCuotas,
          formaPago: dto.formaPago,
          saldoActual: valorConInteres,
          fechaVencimiento: this.calcularFechaVencimiento(dto.formaPago, dto.numeroCuotas),
          latitud: dto.latitud ?? null,
          longitud: dto.longitud ?? null,
          precisionGps: dto.precisionGps ?? null,
        },
      });

      if (dto.codeudorNombresAlias) {
        await tx.codeudor.create({
          data: {
            tenantId: user.tenantId,
            creditoId: credito.id,
            nombresAlias: dto.codeudorNombresAlias,
            documento: dto.codeudorDocumento,
            movil: dto.codeudorMovil,
          },
        });
      }

      return { cliente, credito };
    });
  }

  /**
   * Lista clientes del tenant. Si el usuario es VENDEDOR, solo ve su propia
   * cartera (esto además de la RLS, que es la garantía real a nivel de BD).
   */
  async listar(user: JwtPayload) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const where: any = { tenantId: user.tenantId };
      if (user.rol === 'VENDEDOR') {
        where.vendedorId = user.sub;
      }
      return tx.cliente.findMany({
        where,
        include: { creditos: { orderBy: { fechaInicio: 'desc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  async obtener(id: string, user: JwtPayload) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const cliente = await tx.cliente.findFirst({
        where: { id, tenantId: user.tenantId },
        include: { creditos: { include: { abonos: true, codeudores: true, seguro: true } } },
      });
      if (!cliente) throw new NotFoundException('Cliente no encontrado');
      if (user.rol === 'VENDEDOR' && cliente.vendedorId !== user.sub) {
        throw new ForbiddenException('No puedes ver clientes de otro vendedor');
      }
      return cliente;
    });
  }

  /**
   * Renovación de crédito / Nuevo crédito para cliente existente:
   * Si tiene saldo pendiente anterior, lo liquida contablemente y cruza desembolsos.
   * Si el crédito anterior ya estaba pagado o el cliente no tenía crédito activo ("Sin crédito activo"),
   * emite el nuevo crédito directamente sin errores.
   */
  async renovarCredito(dto: any, user: JwtPayload) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      let creditoAnterior: any = null;
      let cliente: any = null;

      if (dto.creditoAnteriorId) {
        creditoAnterior = await tx.credito.findFirst({
          where: { id: dto.creditoAnteriorId, tenantId: user.tenantId },
          include: { cliente: true },
        });
        if (creditoAnterior) {
          cliente = creditoAnterior.cliente;
        }
      }

      if (!cliente && dto.clienteId) {
        cliente = await tx.cliente.findFirst({
          where: { id: dto.clienteId, tenantId: user.tenantId },
          include: {
            creditos: {
              orderBy: { fechaInicio: 'desc' },
              take: 1,
            },
          },
        });
        if (cliente && cliente.creditos && cliente.creditos.length > 0) {
          const crActivo = await tx.credito.findFirst({
            where: {
              clienteId: cliente.id,
              tenantId: user.tenantId,
              estado: { in: ['ACTIVO', 'EN_MORA'] },
              saldoActual: { gt: 0 },
            },
            orderBy: { fechaInicio: 'desc' },
          });
          creditoAnterior = crActivo || cliente.creditos[0];
        }
      }

      if (!cliente && !creditoAnterior) {
        throw new NotFoundException('Cliente o crédito a renovar no encontrado');
      }

      const clienteIdFinal = cliente?.id || creditoAnterior?.clienteId;
      const vendedorIdAsignado = user.rol === 'VENDEDOR' ? user.sub : (cliente?.vendedorId || creditoAnterior?.vendedorId || user.sub);

      if (user.rol === 'VENDEDOR') {
        if (creditoAnterior && creditoAnterior.vendedorId !== user.sub) {
          throw new ForbiddenException('No puedes renovar créditos de otro vendedor');
        }
        if (cliente && cliente.vendedorId !== user.sub) {
          throw new ForbiddenException('No puedes otorgar créditos a clientes de otro vendedor');
        }
      }

      // Validar si el crédito anterior requiere liquidación
      const tieneCreditoPendiente = creditoAnterior && 
        ['ACTIVO', 'EN_MORA'].includes(creditoAnterior.estado) && 
        Number(creditoAnterior.saldoActual) > 0;

      const saldoPendienteAnterior = tieneCreditoPendiente ? Number(creditoAnterior.saldoActual) : 0;
      const descontar = dto.descontarSaldoAnterior !== false;

      if (tieneCreditoPendiente && descontar && dto.valorPrestamo < saldoPendienteAnterior) {
        throw new BadRequestException(
          `El valor del nuevo préstamo ($${dto.valorPrestamo}) no puede ser inferior al saldo pendiente a cancelar ($${saldoPendienteAnterior})`,
        );
      }

      const netoEntregado = (tieneCreditoPendiente && descontar)
        ? Number((dto.valorPrestamo - saldoPendienteAnterior).toFixed(2))
        : dto.valorPrestamo;

      const valorConInteres = dto.valorPrestamo * (1 + dto.interes / 100);
      const valorCuota = Number((valorConInteres / dto.numeroCuotas).toFixed(2));

      // 1. Si había un crédito pendiente por liquidar, marcarlo como RENOVADO
      if (tieneCreditoPendiente) {
        await tx.credito.update({
          where: { id: creditoAnterior.id },
          data: {
            saldoActual: 0,
            estado: 'RENOVADO',
          },
        });

        // 2. Registrar el abono contable de liquidación por renovación
        if (saldoPendienteAnterior > 0) {
          await tx.abono.create({
            data: {
              tenantId: user.tenantId,
              creditoId: creditoAnterior.id,
              usuarioId: user.sub,
              saldoAnterior: saldoPendienteAnterior,
              valorAbonado: saldoPendienteAnterior,
              saldoNuevo: 0,
              numeroCuota: (creditoAnterior.cuotasPagadas || 0) + 1,
              cuotasAtrasadas: 0,
            },
          });
        }
      }

      // 3. Crear el nuevo crédito
      let prod = dto.productoId
        ? await tx.productoCredito.findFirst({ where: { id: dto.productoId, tenantId: user.tenantId } })
        : null;
      if (!prod) {
        prod = await tx.productoCredito.findFirst({ where: { tenantId: user.tenantId, activo: true } });
      }
      let prodId = prod?.id || creditoAnterior?.productoId;

      if (!prodId) {
        const prodCreado = await tx.productoCredito.create({
          data: {
            tenantId: user.tenantId,
            nombre: 'Crédito General',
            interesDefault: dto.interes || 20.0,
            activo: true,
          },
        });
        prodId = prodCreado.id;
      }

      const codigoNuevo = this.generarCodigoCredito();
      const creditoNuevo = await tx.credito.create({
        data: {
          tenantId: user.tenantId,
          clienteId: clienteIdFinal,
          vendedorId: vendedorIdAsignado,
          productoId: prodId,
          codigoCredito: codigoNuevo,
          valorPrestamo: dto.valorPrestamo,
          valorCuota,
          interes: dto.interes,
          numeroCuotasTotal: dto.numeroCuotas,
          formaPago: dto.formaPago,
          saldoActual: valorConInteres,
          fechaVencimiento: this.calcularFechaVencimiento(dto.formaPago, dto.numeroCuotas),
          estado: 'ACTIVO',
          renovadoDeId: tieneCreditoPendiente ? creditoAnterior.id : (creditoAnterior ? creditoAnterior.id : null),
        },
      });

      // 4. Restaurar estado de visita del cliente a AL_DIA
      await tx.cliente.update({
        where: { id: clienteIdFinal },
        data: { estadoVisita: 'AL_DIA' },
      });

      // 5. Registrar egreso en caja por el neto entregado al cliente
      if (netoEntregado > 0) {
        await tx.movimientoCaja.create({
          data: {
            tenantId: user.tenantId,
            vendedorId: user.sub,
            tipo: 'EGRESO',
            concepto: tieneCreditoPendiente
              ? `Desembolso neto renovación ${creditoAnterior?.codigoCredito} -> ${codigoNuevo}`
              : `Desembolso nuevo crédito ${codigoNuevo}`,
            valor: netoEntregado,
          },
        });
      }

      return {
        message: tieneCreditoPendiente ? 'Crédito renovado exitosamente' : 'Nuevo crédito emitido exitosamente',
        creditoNuevo,
        creditoAnteriorId: creditoAnterior?.id || null,
        saldoLiquidado: saldoPendienteAnterior,
        netoEntregadoCliente: netoEntregado,
      };
    });
  }

  /**
   * Actualiza las coordenadas GPS del cliente y de su crédito activo.
   */
  async actualizarGps(clienteId: string, body: { latitud: number; longitud: number; precisionGps?: number }, user: JwtPayload) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const cliente = await tx.cliente.update({
        where: { id: clienteId },
        data: {
          latitud: body.latitud,
          longitud: body.longitud,
          precisionGps: body.precisionGps ?? null,
        },
      });

      await tx.credito.updateMany({
        where: {
          clienteId,
          tenantId: user.tenantId,
          estado: { in: ['ACTIVO', 'EN_MORA'] },
        },
        data: {
          latitud: body.latitud,
          longitud: body.longitud,
          precisionGps: body.precisionGps ?? null,
        },
      });

      return { message: 'Ubicación GPS actualizada con éxito', cliente };
    });
  }
}
