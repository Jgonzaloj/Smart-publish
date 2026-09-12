import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Protege cualquier endpoint que requiera estar logueado.
// Uso: @UseGuards(JwtAuthGuard)
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
