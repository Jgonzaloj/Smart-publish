import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { DetalleMoraCredito, ResumenEjecucionMora } from './dto/mora.dto';
import { Credito, Cliente } from '@prisma/client';

export interface CalculoAtrasoResult {
  cuotasEsperadas: number;
  cuotasAtrasadas: number;
  estaEnMora: boolean;
  nuevoEstado: 'ACTIVO' | 'EN_MORA';
}

@Injectable()
export class MoraService {
  private readonly logger = new Logger(MoraService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Determina cuántas cuotas deberían haberse pagado a la fecha de referencia
   * y cuántas están en mora según la forma de pago (diario, semanal, quincenal, mensual).
   */
  calcularAtraso(
    credito: Pick<Credito, 'fechaInicio' | 'fechaVencimiento' | 'formaPago' | 'numeroCuotasTotal' | 'cuotasPagadas' | 'saldoActual' | 'estado'>,
    fechaReferencia: Date = new Date(),
  ): CalculoAtrasoResult {
    const inicio = new Date(credito.fechaInicio);
    inicio.setHours(0, 0, 0, 0);

    const ref = new Date(fechaReferencia);
    ref.setHours(0, 0, 0, 0);

    const msPorDia = 1000 * 60 * 60 * 24;
    const diasTranscurridos = Math.max(0, Math.floor((ref.getTime() - inicio.getTime()) / msPorDia));

    let cuotasEsperadas = 0;
    const forma = (credito.formaPago || 'diario').toLowerCase();

    if (forma === 'diario') {
      cuotasEsperadas = diasTranscurridos;
    } else if (forma === 'semanal') {
      cuotasEsperadas = Math.floor(diasTranscurridos / 7);
    } else if (forma === 'quincenal') {
      cuotasEsperadas = Math.floor(diasTranscurridos / 15);
    } else if (forma === 'mensual') {
      cuotasEsperadas = Math.floor(diasTranscurridos / 30);
    } else {
      cuotasEsperadas = diasTranscurridos;
    }

    const cuotasEsperadasClamped = Math.min(Math.max(0, cuotasEsperadas), credito.numeroCuotasTotal);
    let cuotasAtrasadas = Math.max(0, cuotasEsperadasClamped - credito.cuotasPagadas);

    const vencimiento = new Date(credito.fechaVencimiento);
    vencimiento.setHours(0, 0, 0, 0);
    const haVencido = ref.getTime() > vencimiento.getTime() && Number(credito.saldoActual) > 0;

    if (haVencido) {
      cuotasAtrasadas = Math.max(cuotasAtrasadas, credito.numeroCuotasTotal - credito.cuotasPagadas);
    }

    const estaEnMora = cuotasAtrasadas > 0 || haVencido;
    const nuevoEstado = estaEnMora ? 'EN_MORA' : 'ACTIVO';

    return {
      cuotasEsperadas: cuotasEsperadasClamped,
      cuotasAtrasadas,
      estaEnMora,
      nuevoEstado,
    };
  }

  /**
   * Recalcula la mora de un crédito individual dentro de una transacción activa.
   * Utilizado inmediatamente después de registrar un abono para sincronizar estados.
   */
  async recalcularCreditoEnTx(
    tx: any,
    creditoId: string,
    tenantId: string,
    fechaReferencia: Date = new Date(),
  ): Promise<CalculoAtrasoResult> {
    const credito = await tx.credito.findFirst({
      where: { id: creditoId, tenantId },
      include: { cliente: true },
    });

    if (!credito) {
      throw new Error(`Crédito no encontrado: ${creditoId}`);
    }

    const resultado = this.calcularAtraso(credito, fechaReferencia);

    if (credito.saldoActual <= 0) {
      await tx.credito.update({
        where: { id: creditoId },
        data: { estado: 'PAGADO' },
      });
      if (credito.cliente && credito.cliente.estadoVisita === 'ATRASADO') {
        await tx.cliente.update({
          where: { id: credito.cliente.id },
          data: { estadoVisita: 'AL_DIA' },
        });
      }
      return resultado;
    }

    if (credito.estado !== resultado.nuevoEstado) {
      await tx.credito.update({
        where: { id: creditoId },
        data: { estado: resultado.nuevoEstado },
      });
    }

    if (credito.cliente) {
      if (resultado.estaEnMora && credito.cliente.estadoVisita !== 'AUSENTE') {
        await tx.cliente.update({
          where: { id: credito.cliente.id },
          data: { estadoVisita: 'ATRASADO' },
        });
      } else if (!resultado.estaEnMora && credito.cliente.estadoVisita === 'ATRASADO') {
        await tx.cliente.update({
          where: { id: credito.cliente.id },
          data: { estadoVisita: 'AL_DIA' },
        });
      }
    }

    return resultado;
  }

  /**
   * Ejecuta el recálculo masivo de mora para todos los créditos activos de un tenant.
   */
  async ejecutarParaTenant(tenantId: string, fechaStr?: string): Promise<ResumenEjecucionMora> {
    const fechaRef = fechaStr ? new Date(fechaStr + 'T00:00:00') : new Date();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const creditos = await tx.credito.findMany({
        where: {
          tenantId,
          estado: { in: ['ACTIVO', 'EN_MORA'] },
          saldoActual: { gt: 0 },
        },
        include: {
          cliente: true,
        },
      });

      let pasanAEnMora = 0;
      let recuperadosAActivo = 0;
      let alDia = 0;
      const detalles: DetalleMoraCredito[] = [];

      for (const c of creditos) {
        const calculo = this.calcularAtraso(c, fechaRef);
        const estadoAnterior = c.estado;

        if (c.estado !== calculo.nuevoEstado) {
          await tx.credito.update({
            where: { id: c.id },
            data: { estado: calculo.nuevoEstado },
          });

          if (calculo.nuevoEstado === 'EN_MORA') {
            pasanAEnMora++;
          } else {
            recuperadosAActivo++;
          }
        } else if (!calculo.estaEnMora) {
          alDia++;
        }

        // Actualizar estado de visita del cliente
        if (c.cliente) {
          if (calculo.estaEnMora) {
            // Si está en mora y no fue marcado como ausente hoy, pasa a ATRASADO
            if (c.cliente.estadoVisita !== 'ATRASADO') {
              await tx.cliente.update({
                where: { id: c.cliente.id },
                data: { estadoVisita: 'ATRASADO' },
              });
            }
          } else {
            // Si no está en mora y figuraba atrasado, vuelve a AL_DIA
            if (c.cliente.estadoVisita === 'ATRASADO') {
              await tx.cliente.update({
                where: { id: c.cliente.id },
                data: { estadoVisita: 'AL_DIA' },
              });
            }
          }
        }

        detalles.push({
          creditoId: c.id,
          codigoCredito: c.codigoCredito,
          clienteId: c.clienteId,
          clienteNombre: c.cliente ? `${c.cliente.nombresAlias} ${c.cliente.apellidos || ''}`.trim() : 'N/A',
          formaPago: c.formaPago,
          cuotasEsperadas: calculo.cuotasEsperadas,
          cuotasPagadas: c.cuotasPagadas,
          cuotasAtrasadas: calculo.cuotasAtrasadas,
          estadoAnterior,
          nuevoEstado: calculo.nuevoEstado,
          saldoActual: Number(c.saldoActual),
        });
      }

      return {
        tenantId,
        fechaReferencia: fechaRef.toISOString().split('T')[0],
        totalEvaluados: creditos.length,
        pasanAEnMora,
        recuperadosAActivo,
        alDia,
        detalles,
      };
    });
  }

  /**
   * Cron Job global: se ejecuta diariamente a medianoche (00:01)
   * para evaluar todos los tenants activos y resetear ausencias del día anterior.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async ejecutarJobGlobal() {
    this.logger.log('Iniciando Job automático de Mora y Cuotas Atrasadas...');
    try {
      const tenants = await this.prisma.tenant.findMany({
        where: { activo: true },
        select: { id: true, nombreNegocio: true },
      });

      for (const tenant of tenants) {
        try {
          const resultado = await this.ejecutarParaTenant(tenant.id);
          this.logger.log(
            `Mora procesada para ${tenant.nombreNegocio} (${tenant.id}): ` +
            `${resultado.totalEvaluados} evaluados, ${resultado.pasanAEnMora} en mora, ` +
            `${resultado.recuperadosAActivo} recuperados, ${resultado.alDia} al día.`,
          );

          // Resetear clientes marcados como AUSENTE al iniciar un nuevo día
          await this.prisma.withTenant(tenant.id, async (tx) => {
            const clientesAusentes = await tx.cliente.findMany({
              where: { tenantId: tenant.id, estadoVisita: 'AUSENTE' },
              include: {
                creditos: {
                  where: { estado: { in: ['ACTIVO', 'EN_MORA'] } },
                  take: 1,
                },
              },
            });

            for (const cl of clientesAusentes) {
              const creditoActivo = cl.creditos[0];
              const nuevoEstadoVisita = creditoActivo && creditoActivo.estado === 'EN_MORA'
                ? 'ATRASADO'
                : 'AL_DIA';

              await tx.cliente.update({
                where: { id: cl.id },
                data: { estadoVisita: nuevoEstadoVisita },
              });
            }
          });
        } catch (tenantErr) {
          this.logger.error(`Error procesando mora para tenant ${tenant.id}:`, tenantErr);
        }
      }
      this.logger.log('Job de Mora completado con éxito.');
    } catch (err) {
      this.logger.error('Error general en Job automático de Mora:', err);
    }
  }
}
