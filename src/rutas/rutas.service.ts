import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MoraService } from '../mora/mora.service';
import {
  ActualizarOrdenRutaDto,
  CambiarEstadoVisitaDto,
  ConsultaRutaDto,
  MarcarAusenteDto,
  ClienteRutaItem,
  ResumenRutaHoy,
} from './dto/rutas.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class RutasService {
  constructor(
    private prisma: PrismaService,
    private moraService: MoraService,
  ) {}

  private parsearRangoDia(fechaStr?: string): { inicioDia: Date; finDia: Date; fechaTexto: string } {
    const d = fechaStr ? new Date(fechaStr + 'T00:00:00') : new Date();
    const inicioDia = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const finDia = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    const fechaTexto = inicioDia.toISOString().split('T')[0];
    return { inicioDia, finDia, fechaTexto };
  }

  /**
   * Obtiene la hoja de ruta del día para el vendedor, con clientes ordenados,
   * saldo pendiente, cuotas atrasadas, estado de visita e indicador de pago de hoy.
   */
  async obtenerRutaHoy(user: JwtPayload, query: ConsultaRutaDto): Promise<ResumenRutaHoy> {
    const { inicioDia, finDia, fechaTexto } = this.parsearRangoDia(query.fecha);

    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const esAdmin = user.rol === 'ADMIN';
      const filtrarVendedor = user.rol === 'VENDEDOR' || (query.vendedorId && query.vendedorId !== 'todos' && query.vendedorId !== '');
      const vendedorIdFinal = filtrarVendedor ? (user.rol === 'VENDEDOR' ? user.sub : query.vendedorId) : null;

      let vendedorNombre = 'Todos los Cobradores (Supervisión)';
      let nombreRuta = 'Ruta General';

      if (vendedorIdFinal) {
        const vendedor = await tx.usuario.findFirst({
          where: { id: vendedorIdFinal, tenantId: user.tenantId },
          select: { id: true, nombre: true, posicion: true },
        });

        if (!vendedor && user.rol === 'VENDEDOR') {
          throw new NotFoundException('Vendedor no encontrado');
        }
        if (vendedor) {
          vendedorNombre = vendedor.nombre;
          nombreRuta = vendedor.posicion || 'Ruta Principal';
        }
      }

      // Obtener configuración de orden de ruta existente (si aplica a un vendedor)
      const ruta = vendedorIdFinal
        ? await tx.ruta.findFirst({
            where: { tenantId: user.tenantId, vendedorId: vendedorIdFinal },
          })
        : null;

      const ordenConfig: string[] = Array.isArray(ruta?.ordenVisitas)
        ? (ruta.ordenVisitas as string[])
        : [];

      // Obtener clientes del vendedor (o de toda la empresa si es Admin en modo Todos)
      const whereCliente: any = { tenantId: user.tenantId };
      if (vendedorIdFinal) {
        whereCliente.vendedorId = vendedorIdFinal;
      }

      const clientes = await tx.cliente.findMany({
        where: whereCliente,
        include: {
          creditos: {
            where: {
              estado: { in: ['ACTIVO', 'EN_MORA'] },
              saldoActual: { gt: 0 },
            },
            orderBy: { fechaInicio: 'desc' },
            take: 1,
          },
        },
      });

      // Obtener abonos registrados hoy para estos créditos
      const creditosIds = clientes
        .flatMap((c) => c.creditos)
        .map((cr) => cr.id);

      const abonosHoy = creditosIds.length > 0
        ? await tx.abono.findMany({
            where: {
              tenantId: user.tenantId,
              creditoId: { in: creditosIds },
              fecha: { gte: inicioDia, lte: finDia },
            },
          })
        : [];

      // Mapear abonos por creditoId
      const mapaAbonosPorCredito = new Map<string, number>();
      for (const abono of abonosHoy) {
        const actual = mapaAbonosPorCredito.get(abono.creditoId) || 0;
        mapaAbonosPorCredito.set(abono.creditoId, actual + Number(abono.valorAbonado));
      }

      // Construir mapa de orden según ruta
      const mapaOrden = new Map<string, number>();
      ordenConfig.forEach((id, idx) => mapaOrden.set(id, idx));

      // Procesar clientes
      const items: ClienteRutaItem[] = [];
      let totalRecaudadoHoy = 0;
      let totalEsperadoHoy = 0;
      let cobradosHoy = 0;
      let ausentesHoy = 0;
      let atrasadosHoy = 0;

      for (const c of clientes) {
        const creditoActivo = c.creditos[0] || null;
        let creditoItem: ClienteRutaItem['creditoActivo'] = null;
        let totalAbonadoHoy = 0;

        if (creditoActivo) {
          totalAbonadoHoy = mapaAbonosPorCredito.get(creditoActivo.id) || 0;
          totalRecaudadoHoy += totalAbonadoHoy;
          totalEsperadoHoy += Number(creditoActivo.valorCuota);

          const calculoMora = this.moraService.calcularAtraso(creditoActivo, inicioDia);

          creditoItem = {
            id: creditoActivo.id,
            codigoCredito: creditoActivo.codigoCredito,
            valorPrestamo: Number(creditoActivo.valorPrestamo),
            valorCuota: Number(creditoActivo.valorCuota),
            formaPago: creditoActivo.formaPago,
            saldoActual: Number(creditoActivo.saldoActual),
            cuotasTotal: creditoActivo.numeroCuotasTotal,
            cuotasPagadas: creditoActivo.cuotasPagadas,
            cuotasAtrasadas: calculoMora.cuotasAtrasadas,
            estado: calculoMora.nuevoEstado,
            fechaVencimiento: creditoActivo.fechaVencimiento,
          };
        }

        const haPagadoHoy = totalAbonadoHoy > 0;
        if (haPagadoHoy) cobradosHoy++;
        if (c.estadoVisita === 'AUSENTE') ausentesHoy++;
        let aplazadosHoy = 0;
        if (c.estadoVisita === 'APLAZADO') aplazadosHoy++;
        if (c.estadoVisita === 'ATRASADO' || (creditoItem && creditoItem.cuotasAtrasadas > 0)) {
          atrasadosHoy++;
        }

        const ordenPos = mapaOrden.has(c.id) ? mapaOrden.get(c.id)! : 999999;

        items.push({
          clienteId: c.id,
          nombresAlias: c.nombresAlias,
          apellidos: c.apellidos,
          documento: c.documento,
          movil: c.movil,
          telefono: c.telefono,
          direccion: c.direccion,
          estadoVisita: c.estadoVisita as 'AL_DIA' | 'ATRASADO' | 'AUSENTE' | 'APLAZADO',
          orden: ordenPos,
          haPagadoHoy,
          totalAbonadoHoy,
          creditoActivo: creditoItem,
        });
      }

      // Clientes creados hoy
      const clientesNuevosHoy = await tx.cliente.count({
        where: {
          tenantId: user.tenantId,
          ...(vendedorIdFinal ? { vendedorId: vendedorIdFinal } : {}),
          createdAt: { gte: inicioDia, lte: finDia },
        },
      });

      const totalAplazados = items.filter(it => it.estadoVisita === 'APLAZADO').length;

      // Ordenar: primero los configurados en ordenVisitas, luego por id/orden
      items.sort((a, b) => a.orden - b.orden);

      // Re-indexar orden secuencial para presentación (1, 2, 3...)
      items.forEach((item, index) => {
        item.orden = index + 1;
      });

      const totalClientes = items.length;
      const pendientesHoy = Math.max(0, totalClientes - cobradosHoy - ausentesHoy - totalAplazados);

      return {
        vendedorId: vendedorIdFinal || 'todos',
        vendedorNombre,
        nombreRuta: ruta?.nombreRuta || nombreRuta,
        fecha: fechaTexto,
        metricas: {
          totalClientes,
          clientesCobradosHoy: cobradosHoy,
          clientesPendientesHoy: pendientesHoy,
          clientesAusentesHoy: ausentesHoy,
          clientesAplazadosHoy: totalAplazados,
          clientesAtrasadosHoy: atrasadosHoy,
          clientesNuevosHoy,
          totalRecaudadoHoy: Number(totalRecaudadoHoy.toFixed(2)),
          totalEsperadoHoy: Number(totalEsperadoHoy.toFixed(2)),
        },
        clientes: items,
      };
    });
  }

  /**
   * Marca a un cliente como AUSENTE durante la jornada de cobro.
   */
  async marcarAusente(clienteId: string, user: JwtPayload, dto?: MarcarAusenteDto) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const cliente = await tx.cliente.findFirst({
        where: { id: clienteId, tenantId: user.tenantId },
      });

      if (!cliente) {
        throw new NotFoundException('Cliente no encontrado');
      }

      if (user.rol === 'VENDEDOR' && cliente.vendedorId !== user.sub) {
        throw new ForbiddenException('No puedes marcar ausente a un cliente de otro vendedor');
      }

      const actualizado = await tx.cliente.update({
        where: { id: clienteId },
        data: {
          estadoVisita: 'AUSENTE',
        },
      });

      return {
        message: 'Cliente marcado como AUSENTE para la visita de hoy',
        clienteId: actualizado.id,
        estadoVisita: actualizado.estadoVisita,
        observaciones: dto?.observaciones,
        latitud: dto?.latitud,
        longitud: dto?.longitud,
        precisionGps: dto?.precisionGps,
      };
    });
  }

  /**
   * Cambia manualmente el estado de visita de un cliente (AL_DIA, ATRASADO, AUSENTE).
   */
  async cambiarEstadoVisita(clienteId: string, dto: CambiarEstadoVisitaDto, user: JwtPayload) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const cliente = await tx.cliente.findFirst({
        where: { id: clienteId, tenantId: user.tenantId },
      });

      if (!cliente) {
        throw new NotFoundException('Cliente no encontrado');
      }

      if (user.rol === 'VENDEDOR' && cliente.vendedorId !== user.sub) {
        throw new ForbiddenException('No puedes modificar el estado de un cliente de otro vendedor');
      }

      const actualizado = await tx.cliente.update({
        where: { id: clienteId },
        data: {
          estadoVisita: dto.estadoVisita,
        },
      });

      return {
        message: `Estado de visita actualizado a ${dto.estadoVisita}`,
        clienteId: actualizado.id,
        estadoVisita: actualizado.estadoVisita,
      };
    });
  }

  /**
   * Guarda o actualiza el orden de visita de los clientes para la ruta del vendedor.
   */
  async guardarOrdenRuta(dto: ActualizarOrdenRutaDto, user: JwtPayload) {
    const vendedorId = user.rol === 'VENDEDOR' ? user.sub : dto.vendedorId || user.sub;

    return this.prisma.withTenant(user.tenantId, async (tx) => {
      // Validar que los IDs existan y correspondan al tenant
      if (dto.ordenClienteIds.length > 0) {
        const clientesCount = await tx.cliente.count({
          where: {
            id: { in: dto.ordenClienteIds },
            tenantId: user.tenantId,
          },
        });

        if (clientesCount !== dto.ordenClienteIds.length) {
          throw new BadRequestException('Algunos IDs de clientes son inválidos o no pertenecen a este negocio');
        }
      }

      const rutaExistente = await tx.ruta.findFirst({
        where: { tenantId: user.tenantId, vendedorId },
      });

      if (rutaExistente) {
        return tx.ruta.update({
          where: { id: rutaExistente.id },
          data: {
            ordenVisitas: dto.ordenClienteIds,
            nombreRuta: dto.nombreRuta || rutaExistente.nombreRuta,
          },
        });
      } else {
        return tx.ruta.create({
          data: {
            tenantId: user.tenantId,
            vendedorId,
            nombreRuta: dto.nombreRuta || 'Ruta Principal',
            ordenVisitas: dto.ordenClienteIds,
          },
        });
      }
    });
  }

  async actualizarOrdenRuta(dto: ActualizarOrdenRutaDto, user: JwtPayload) {
    return this.guardarOrdenRuta(dto, user);
  }
}
