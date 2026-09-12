import { Module } from '@nestjs/common';
import { RutasService } from './rutas.service';
import { RutasController } from './rutas.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MoraModule } from '../mora/mora.module';

@Module({
  imports: [PrismaModule, MoraModule],
  controllers: [RutasController],
  providers: [RutasService],
  exports: [RutasService],
})
export class RutasModule {}
