import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CrearAbonoDto {
  @IsString() creditoId: string;
  @IsNumber() @Min(0.01) valorAbonado: number;
  @IsOptional() @IsNumber() latitud?: number;
  @IsOptional() @IsNumber() longitud?: number;
  @IsOptional() @IsNumber() precisionGps?: number;
}

