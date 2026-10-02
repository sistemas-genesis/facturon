import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FirmaInfoDto } from './dto.js';
import { FirmaService } from './firma.service.js';

@ApiTags('Firma')
@Controller('api/firma')
export class FirmaController {
  constructor(private readonly firma: FirmaService) {}

  /** Dias para la caducidad de la firma, como texto ("-3", "120"); vacio si no hay firma configurada. */
  @Get('fecha_caducidad/:ruc')
  fechaCaducidad(@Param('ruc') ruc: string) {
    return this.firma.diasParaCaducar(ruc);
  }

  /** { success, data|msg }. Los errores de la firma se informan en el cuerpo con HTTP 200. */
  @Post('info')
  @HttpCode(200)
  info(@Body() body: FirmaInfoDto) {
    return this.firma.info(body.firma, body.pass);
  }
}
