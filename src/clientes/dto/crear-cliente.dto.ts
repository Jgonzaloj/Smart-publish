import { IsString, IsOptional, IsNumber, IsInt, Min } from 'class-validator';

export class CrearClienteDto {
  @IsOptional() @IsString() documento?: string;
  @IsString() nombresAlias: string;
  @IsOptional() @IsString() apellidos?: string;
  @IsString() movil: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional() @IsString() direccion?: string;

  // Codeudor opcional
  @IsOptional() @IsString() codeudorNombresAlias?: string;
  @IsOptional() @IsString() codeudorDocumento?: string;
  @IsOptional() @IsString() codeudorMovil?: string;

  // Ubicación GPS del cliente / préstamo
  @IsOptional() @IsNumber() latitud?: number;
  @IsOptional() @IsNumber() longitud?: number;
  @IsOptional() @IsNumber() precisionGps?: number;

  // Detalles de la venta / crédito
  @IsOptional() @IsString() vendedorId?: string;
  @IsOptional() @IsString() productoId?: string;
  @IsNumber() @Min(0.01) valorPrestamo: number;
  @IsInt() @Min(1) numeroCuotas: number;
  @IsNumber() interes: number;
  @IsString() formaPago: string; // diario / semanal / quincenal
}

export class RenovarCreditoDto {
  @IsString() creditoAnteriorId: string;
  @IsOptional() @IsString() productoId?: string;
  @IsNumber() @Min(0.01) valorPrestamo: number;
  @IsInt() @Min(1) numeroCuotas: number;
  @IsNumber() interes: number;
  @IsString() formaPago: string; // diario / semanal / quincenal / mensual
  @IsOptional() descontarSaldoAnterior?: boolean;
}
