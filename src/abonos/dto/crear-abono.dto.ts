import { IsString, IsNumber, Min, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class CrearAbonoDto {
  @IsString() creditoId: string;
  @IsNumber() @Min(0.01) valorAbonado: number;
  @IsOptional() @IsIn(['EFECTIVO', 'TRANSFERENCIA', 'NEQUI', 'YAPE', 'OTRO']) metodoPago?: 'EFECTIVO' | 'TRANSFERENCIA' | 'NEQUI' | 'YAPE' | 'OTRO';
  @IsOptional() @IsBoolean() esAdicional?: boolean;
  @IsOptional() @IsNumber() latitud?: number;
  @IsOptional() @IsNumber() longitud?: number;
  @IsOptional() @IsNumber() precisionGps?: number;
}


