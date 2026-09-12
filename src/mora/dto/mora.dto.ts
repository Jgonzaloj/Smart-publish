import { IsOptional, IsDateString } from 'class-validator';

export class EjecutarMoraDto {
  @IsOptional()
  @IsDateString()
  fechaReferencia?: string; // Fecha de corte en formato YYYY-MM-DD (por defecto hoy)
}

export interface DetalleMoraCredito {
  creditoId: string;
  codigoCredito: string;
  clienteId: string;
  clienteNombre: string;
  formaPago: string;
  cuotasEsperadas: number;
  cuotasPagadas: number;
  cuotasAtrasadas: number;
  estadoAnterior: string;
  nuevoEstado: string;
  saldoActual: number;
}

export interface ResumenEjecucionMora {
  tenantId: string;
  fechaReferencia: string;
  totalEvaluados: number;
  pasanAEnMora: number;
  recuperadosAActivo: number;
  alDia: number;
  detalles: DetalleMoraCredito[];
}
