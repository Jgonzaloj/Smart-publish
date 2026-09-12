import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ClientesModule } from './clientes/clientes.module';
import { AbonosModule } from './abonos/abonos.module';
import { CajaModule } from './caja/caja.module';
import { MoraModule } from './mora/mora.module';
import { RutasModule } from './rutas/rutas.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    ClientesModule,
    AbonosModule,
    CajaModule,
    MoraModule,
    RutasModule,
    DashboardModule,
  ],
})
export class AppModule {}
