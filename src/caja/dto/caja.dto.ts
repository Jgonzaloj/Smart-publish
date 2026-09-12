import { IsString, IsNumber, Min, IsIn, IsOptional, IsDateString } from 'class-validator';

export class CrearMovimientoDto {
  @IsIn(['INGRESO', 'EGRESO'])
  tipo: 'INGRESO' | 'EGRESO';

  @IsString()
  concepto: string;

  @IsNumber()
  @Min(0.01)
  valor: number;
}

export class RetiroCajaDto {
  @IsNumber()
  @Min(0.01)
  valor: number;

  @IsOptional()
  @IsString()
  concepto?: string;
}

export class CerrarCuadreDto {
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class ConsultaFechaDto {
  @IsOptional()
  @IsDateString()
  fecha?: string; // formato YYYY-MM-DD, si no se envía se usa hoy
}
