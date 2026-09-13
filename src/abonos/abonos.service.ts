import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearAbonoDto } from './dto/crear-abono.dto';
import { JwtPayload } from '../auth/jwt.strategy';

import { MoraService } from '../mora/mora.service';

@Injectable()
export class AbonosService {
  constructor(
    private prisma: PrismaService,
    private moraService: MoraService,
  ) {}

  /**
   * Registra un abono normal (equivalente al comprobante de la app original:
   * saldo anterior -> valor abonado -> saldo nuevo).
   * Sincroniza de inmediato cuotas atrasadas y estado de mora.
   */
  async crear(dto: CrearAbonoDto, user: JwtPayload) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const credito = await tx.credito.findFirst({
        where: { id: dto.creditoId },
        include: { cliente: true },
      });
      if (!credito) throw new NotFoundException('Crédito no encontrado');

      if (user.rol === 'VENDEDOR' && credito.vendedorId !== user.sub) {
        throw new ForbiddenException('No puedes cobrar créditos de otro vendedor');
      }

      if (dto.valorAbonado > Number(credito.saldoActual)) {
        throw new BadRequestException('El abono no puede ser mayor al saldo pendiente');
      }

      const saldoAnterior = Number(credito.saldoActual);
      const saldoNuevo = Number((saldoAnterior - dto.valorAbonado).toFixed(2));
      const cuotasPagadas = credito.cuotasPagadas + 1;
      const quedaPagado = saldoNuevo <= 0;

      // Calcular mora con la nueva cantidad de cuotas pagadas
      const calculoMora = this.moraService.calcularAtraso(
        {
          ...credito,
          cuotasPagadas,
          saldoActual: saldoNuevo as any,
        },
        new Date(),
      );

      const nuevoEstadoCredito = quedaPagado ? 'PAGADO' : calculoMora.nuevoEstado;

      const abono = await tx.abono.create({
        data: {
          tenantId: user.tenantId,
          creditoId: credito.id,
          usuarioId: user.sub,
          saldoAnterior,
          valorAbonado: dto.valorAbonado,
          saldoNuevo,
          fecha: new Date(),
          numeroCuota: cuotasPagadas,
          cuotasAtrasadas: quedaPagado ? 0 : calculoMora.cuotasAtrasadas,
          latitud: dto.latitud,
          longitud: dto.longitud,
          precisionGps: dto.precisionGps,
        },
      });

      await tx.credito.update({
        where: { id: credito.id },
        data: {
          saldoActual: saldoNuevo,
          cuotasPagadas,
          estado: nuevoEstadoCredito,
        },
      });

      // Si el crédito se pagó por completo o ya no está en mora, actualizar estado del cliente
      if (credito.cliente) {
        if (quedaPagado || !calculoMora.estaEnMora) {
          if (credito.cliente.estadoVisita === 'ATRASADO') {
            await tx.cliente.update({
              where: { id: credito.cliente.id },
              data: { estadoVisita: 'AL_DIA' },
            });
          }
        }
      }

      const ahora = new Date();
      const horaStr = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}:${String(ahora.getSeconds()).padStart(2, '0')}`;
      const recibo = {
        fecha: ahora.toISOString().slice(0, 10),
        hora: horaStr,
        usuario: user.nombre || 'Cobrador',
        documento: credito.cliente?.documento || '',
        cliente: `${credito.cliente?.nombresAlias || ''} ${credito.cliente?.apellidos || ''}`.trim(),
        movil: credito.cliente?.movil || '',
        tipoAbono: quedaPagado ? 'Liquidación total' : 'Abono normal',
        codigoCredito: credito.codigoCredito,
        saldoAnterior,
        valorAbonado: dto.valorAbonado,
        saldoNuevo,
        formaPago: credito.formaPago ? credito.formaPago.charAt(0).toUpperCase() + credito.formaPago.slice(1) : 'Diario',
        cuotasPagadas,
        numeroCuotasTotal: credito.numeroCuotasTotal,
        cuotasAtrasadas: quedaPagado ? 0 : calculoMora.cuotasAtrasadas,
        fechaVencimiento: credito.fechaVencimiento ? new Date(credito.fechaVencimiento).toISOString().slice(0, 10) : '',
        latitud: dto.latitud,
        longitud: dto.longitud,
        precisionGps: dto.precisionGps,
      };

      return {
        ...abono,
        recibo,
      };
    });
  }

  async listarPorCredito(creditoId: string, user: JwtPayload) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      return tx.abono.findMany({ where: { creditoId }, orderBy: { fecha: 'desc' } });
    });
  }

  /**
   * Genera el extracto de cuenta completo del cliente con desglose de abonos,
   * cobrador receptor y auditoría satelital GPS para compartir por WhatsApp.
   */
  async obtenerExtractoCredito(creditoId: string, user: JwtPayload) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const credito = await tx.credito.findFirst({
        where: { id: creditoId },
        include: { cliente: true },
      });

      if (!credito) {
        throw new NotFoundException('Crédito no encontrado');
      }

      const cliente = credito.cliente || (await tx.cliente.findFirst({ where: { id: credito.clienteId } }));
      const abonos = await tx.abono.findMany({
        where: { creditoId },
        orderBy: { fecha: 'asc' },
      });

      const usuarios = await tx.usuario.findMany({
        select: { id: true, nombre: true },
      });
      const usuariosMap = new Map<string, string>();
      usuarios.forEach((u) => usuariosMap.set(u.id, u.nombre));

      const totalAbonado = abonos.reduce((sum, a) => sum + Number(a.valorAbonado), 0);
      const totalPagar = Number(credito.valorPrestamo) * (1 + Number(credito.interes) / 100);
      const porcentajePagado = totalPagar > 0 ? Math.min(100, Math.round((totalAbonado / totalPagar) * 100)) : 0;

      const historialAbonos = abonos.map((a, idx) => {
        const rawDate = a.fecha || (a as any).createdAt || new Date();
        const dateObj = new Date(rawDate);
        const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
        return {
          numero: idx + 1,
          id: a.id,
          fecha: validDate.toISOString().slice(0, 10),
          hora: validDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          valorAbonado: Number(a.valorAbonado),
          saldoAnterior: Number(a.saldoAnterior),
          saldoNuevo: Number(a.saldoNuevo),
          cobrador: usuariosMap.get(a.usuarioId) || 'Cobrador',
          latitud: a.latitud,
          longitud: a.longitud,
          precisionGps: a.precisionGps,
        };
      });

      const calculoMora = this.moraService.calcularAtraso(credito);

      return {
        cliente: {
          id: cliente?.id,
          nombre: `${cliente?.nombresAlias || ''} ${cliente?.apellidos || ''}`.trim(),
          documento: cliente?.documento,
          movil: cliente?.movil,
          telefono: cliente?.telefono,
          direccion: cliente?.direccion,
        },
        credito: {
          id: credito.id,
          codigoCredito: credito.codigoCredito,
          valorPrestamo: Number(credito.valorPrestamo),
          interes: Number(credito.interes),
          totalPagar,
          valorCuota: Number(credito.valorCuota),
          formaPago: credito.formaPago,
          cuotasTotal: credito.numeroCuotasTotal,
          cuotasPagadas: credito.cuotasPagadas || abonos.length,
          cuotasAtrasadas: calculoMora.cuotasAtrasadas,
          saldoActual: Number(credito.saldoActual),
          estado: credito.estado,
          fechaInicio: credito.fechaInicio ? new Date(credito.fechaInicio).toISOString().slice(0, 10) : '',
          fechaVencimiento: credito.fechaVencimiento ? new Date(credito.fechaVencimiento).toISOString().slice(0, 10) : '',
        },
        resumenAmortizacion: {
          totalAbonado,
          porcentajePagado,
          saldoPendiente: Number(credito.saldoActual),
          totalAbonosRegistrados: abonos.length,
        },
        historialAbonos,
      };
    });
  }
}
