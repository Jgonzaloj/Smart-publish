import { Module } from '@nestjs/common';
import { AbonosController } from './abonos.controller';
import { AbonosService } from './abonos.service';

import { PrismaModule } from '../prisma/prisma.module';
import { MoraModule } from '../mora/mora.module';

@Module({
  imports: [PrismaModule, MoraModule],
  controllers: [AbonosController],
  providers: [AbonosService],
  exports: [AbonosService],
})
export class AbonosModule {}
