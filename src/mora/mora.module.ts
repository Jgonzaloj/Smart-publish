import { Module } from '@nestjs/common';
import { MoraService } from './mora.service';
import { MoraController } from './mora.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MoraController],
  providers: [MoraService],
  exports: [MoraService],
})
export class MoraModule {}
