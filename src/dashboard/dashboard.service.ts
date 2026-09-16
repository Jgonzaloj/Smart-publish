import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MoraService } from '../mora/mora.service';
import { JwtPayload } from '../auth/jwt.strategy';

function toDecimal(val: any): Prisma.Decimal {
  if (val === null || val === undefined) return new Prisma.Decimal(0);
  if (val instanceof Prisma.Decimal) return val;
  return new Prisma.Decimal(val);
}

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private moraService: MoraService,
  ) {}

  /**
   * Genera el resumen ejecutivo consolidado del negocio para el Administrador.
   */
  async obtenerResumenEjecutivo(user: JwtPayload) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const now = new Date();
      const inicioHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const finHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      // 1. Obtener todas las entidades principales del tenant
      const [creditos, abonos, usuarios, clientes] = await Promise.all([
        tx.credito.findMany({
          include: { cliente: true },
        }),
        tx.abono.findMany({
          orderBy: { fecha: 'desc' },
        }),
        tx.usuario.findMany({
          where: { rol: 'VENDEDOR' },
        }),
        tx.cliente.findMany(),
      ]);

      // 2. Métricas de Cartera Global con precisión Decimal
      const creditosActivos = creditos.filter((c) => c.estado === 'ACTIVO' || c.estado === 'EN_MORA');
      const totalPrestadoHistoricoDec = creditos.reduce((sum, c) => sum.plus(toDecimal(c.valorPrestamo)), new Prisma.Decimal(0));
      const totalRecuperadoHistoricoDec = abonos.reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new Prisma.Decimal(0));
      const carteraActivaTotalDec = creditosActivos.reduce((sum, c) => sum.plus(toDecimal(c.saldoActual)), new Prisma.Decimal(0));

      // 3. Métricas de la Jornada de Hoy
      const abonosHoy = abonos.filter((a) => {
        const raw = a.fecha || (a as any).createdAt;
        if (!raw) return false;
        const f = new Date(raw);
        return !isNaN(f.getTime()) && f >= inicioHoy && f <= finHoy;
      });
      const totalCobradoHoyDec = abonosHoy.reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new Prisma.Decimal(0));
      const totalEsperadoHoyDec = creditosActivos.reduce((sum, c) => sum.plus(toDecimal(c.valorCuota)), new Prisma.Decimal(0));
      
      const porcentajeCumplimientoHoy = totalEsperadoHoyDec.gt(0)
        ? Math.min(100, Math.round(totalCobradoHoyDec.dividedBy(totalEsperadoHoyDec).times(100).toNumber()))
        : 0;

      // 4. Indicadores de Riesgo (PAR 30 / PAR 60)
      let saldoPar30Dec = new Prisma.Decimal(0);
      let saldoPar60Dec = new Prisma.Decimal(0);
      let creditosAlDia = 0;
      let creditosEnAtraso = 0;
      let creditosEnMoraSevera = 0;

      creditosActivos.forEach((c) => {
        const calculoMora = this.moraService.calcularAtraso(c);
        const atrasadas = calculoMora.cuotasAtrasadas;
        const saldoDec = toDecimal(c.saldoActual);

        if (atrasadas === 0) {
          creditosAlDia++;
        } else if (atrasadas < 30) {
          creditosEnAtraso++;
        } else if (atrasadas >= 30 && atrasadas < 60) {
          creditosEnMoraSevera++;
          saldoPar30Dec = saldoPar30Dec.plus(saldoDec);
        } else if (atrasadas >= 60) {
          creditosEnMoraSevera++;
          saldoPar30Dec = saldoPar30Dec.plus(saldoDec);
          saldoPar60Dec = saldoPar60Dec.plus(saldoDec);
        }
      });

      const porcentajePar30 = carteraActivaTotalDec.gt(0)
        ? Number(saldoPar30Dec.dividedBy(carteraActivaTotalDec).times(100).toFixed(2))
        : 0;
      const porcentajePar60 = carteraActivaTotalDec.gt(0)
        ? Number(saldoPar60Dec.dividedBy(carteraActivaTotalDec).times(100).toFixed(2))
        : 0;

      // 5. Cobranza de los últimos 7 días (Lunes a Domingo / Días recientes)
      const ultimos7Dias: { fecha: string; dia: string; total: number; abonosCount: number }[] = [];
      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const inicioDia = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        const finDia = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

        const abonosDelDia = abonos.filter((a) => {
          const raw = a.fecha || (a as any).createdAt;
          if (!raw) return false;
          const fa = new Date(raw);
          return !isNaN(fa.getTime()) && fa >= inicioDia && fa <= finDia;
        });

        const totalDiaDec = abonosDelDia.reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new Prisma.Decimal(0));
        const fechaStr = inicioDia.toISOString().slice(0, 10);
        const diaNombre = diasSemana[inicioDia.getDay()];

        ultimos7Dias.push({
          fecha: fechaStr,
          dia: `${diaNombre} ${inicioDia.getDate()}`,
          total: totalDiaDec.toNumber(),
          abonosCount: abonosDelDia.length,
        });
      }

      // 6. Ranking y Desempeño por Cobrador
      const rankingCobradores = usuarios.map((u) => {
        const clientesCobrador = clientes.filter((cl) => cl.vendedorId === u.id);
        const creditosCobrador = creditosActivos.filter((cr) => cr.vendedorId === u.id);
        const carteraCobradorDec = creditosCobrador.reduce((sum, cr) => sum.plus(toDecimal(cr.saldoActual)), new Prisma.Decimal(0));

        const abonosCobradorHoy = abonosHoy.filter((a) => a.usuarioId === u.id);
        const cobradoHoyDec = abonosCobradorHoy.reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new Prisma.Decimal(0));
        const esperadoCobradorHoyDec = creditosCobrador.reduce((sum, cr) => sum.plus(toDecimal(cr.valorCuota)), new Prisma.Decimal(0));
        const efectividad = esperadoCobradorHoyDec.gt(0)
          ? Math.min(100, Math.round(cobradoHoyDec.dividedBy(esperadoCobradorHoyDec).times(100).toNumber()))
          : 0;

        return {
          id: u.id,
          nombre: u.nombre,
          posicion: u.posicion || 'Ruta General',
          totalClientes: clientesCobrador.length,
          creditosActivos: creditosCobrador.length,
          carteraTotal: carteraCobradorDec.toNumber(),
          cobradoHoy: cobradoHoyDec.toNumber(),
          efectividad,
          activo: u.activo,
        };
      });

      // Ordenar cobradores por mayor cobro hoy
      rankingCobradores.sort((a, b) => b.cobradoHoy - a.cobradoHoy);

      return {
        financiero: {
          totalPrestadoHistorico: totalPrestadoHistoricoDec.toNumber(),
          totalRecuperadoHistorico: totalRecuperadoHistoricoDec.toNumber(),
          carteraActivaTotal: carteraActivaTotalDec.toNumber(),
          totalCobradoHoy: totalCobradoHoyDec.toNumber(),
          totalEsperadoHoy: totalEsperadoHoyDec.toNumber(),
          porcentajeCumplimientoHoy,
          clientesTotal: clientes.length,
          creditosActivosTotal: creditosActivos.length,
        },
        riesgo: {
          saldoPar30: saldoPar30Dec.toNumber(),
          porcentajePar30,
          saldoPar60: saldoPar60Dec.toNumber(),
          porcentajePar60,
          creditosAlDia,
          creditosEnAtraso,
          creditosEnMoraSevera,
        },
        ultimos7Dias,
        rankingCobradores,
      };
    });
  }
}

