import { HttpException } from '@nestjs/common';

/**
 * Error HTTP cuyo cuerpo es el del servicio legacy ({ success:false, msg }) y no el formato
 * estandar de Nest. AllExceptionsFilter lo devuelve tal cual, para no romper al front existente.
 */
export class LegacyError extends HttpException {
  constructor(status: number, msg: string) {
    super({ success: false, msg, legacy: true }, status);
  }
}
