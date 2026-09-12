import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
} from 'class-validator';

export enum RolUsuario {
  ADMIN = 'ADMIN',
  VENDEDOR = 'VENDEDOR',
}

export class CrearUsuarioDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener mínimo 6 caracteres' })
  password: string;

  @IsEnum(RolUsuario, { message: 'El rol debe ser ADMIN o VENDEDOR' })
  rol: RolUsuario;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  posicion?: string;

  @IsOptional()
  @IsString()
  pin?: string;
}

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  posicion?: string;

  @IsOptional()
  @IsEnum(RolUsuario, { message: 'El rol debe ser ADMIN o VENDEDOR' })
  rol?: RolUsuario;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class CambiarPasswordDto {
  @IsString()
  @MinLength(6, { message: 'La nueva contraseña debe tener mínimo 6 caracteres' })
  password: string;
}

export class CambiarPinDto {
  @IsString()
  @MinLength(4, { message: 'El PIN debe tener mínimo 4 dígitos' })
  pin: string;
}

export class AlternarEstadoDto {
  @IsBoolean()
  activo: boolean;
}
