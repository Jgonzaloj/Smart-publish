import { IsArray, IsIn, IsOptional, IsString, IsDateString } from 'class-validator';

export class ActualizarOrdenRutaDto {
  @IsArray()
  @IsString({ each: true })
  ordenClienteIds: string[];

  @IsOptional()
  @IsString()
  nombreRuta?: string;

  @IsOptional()
  @IsString()
  vendedorId?: string;
}

export class MarcarAusenteDto {
  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  latitud?: number;

  @IsOptional()
  longitud?: number;

  @IsOptional()
  precisionGps?: number;
}

export class CambiarEstadoVisitaDto {
  @IsIn(['AL_DIA', 'ATRASADO', 'AUSENTE'])
  estadoVisita: 'AL_DIA' | 'ATRASADO' | 'AUSENTE';

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class ConsultaRutaDto {
  @IsOptional()
  @IsString()
  vendedorId?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}

export interface ClienteRutaItem {
  clienteId: string;
  nombresAlias: string;
  apellidos: string | null;
  documento: string | null;
  movil: string;
  telefono: string | null;
  direccion: string | null;
  estadoVisita: 'AL_DIA' | 'ATRASADO' | 'AUSENTE';
  orden: number;
  haPagadoHoy: boolean;
  totalAbonadoHoy: number;
  creditoActivo: {
    id: string;
    codigoCredito: string;
    valorPrestamo: number;
    valorCuota: number;
    formaPago: string;
    saldoActual: number;
    cuotasTotal: number;
    cuotasPagadas: number;
    cuotasAtrasadas: number;
    estado: string;
    fechaVencimiento: Date;
  } | null;
}

export interface ResumenRutaHoy {
  vendedorId: string;
  vendedorNombre: string;
  nombreRuta: string;
  fecha: string;
  metricas: {
    totalClientes: number;
    clientesCobradosHoy: number;
    clientesPendientesHoy: number;
    clientesAusentesHoy: number;
    clientesAtrasadosHoy: number;
    totalRecaudadoHoy: number;
    totalEsperadoHoy: number;
  };
  clientes: ClienteRutaItem[];
}
