import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { RideTipo } from '../common/sri-xml.js';
import { RideXmlDto } from './dto.js';
import { RideService } from './ride.service.js';

/**
 * POST /api/documento/ride/<tipo>/:fechaAutorizacion  body { xml }
 * Respuesta: texto con el nombre del PDF generado (`<claveAcceso>.pdf`); se descarga en /api/pdf/:file.
 * La empresa se determina por el RUC del XML (igual que el servicio original), no por :db.
 */
@ApiTags('RIDE')
@Controller('api/documento/ride')
export class RideController {
  constructor(private readonly ride: RideService) {}

  private async render(tipo: RideTipo, fecha: string, body: RideXmlDto) {
    return (await this.ride.generate(tipo, body.xml, fecha)).file;
  }

  @Post('factura/:fechaAutorizacion')
  @HttpCode(200)
  factura(@Param('fechaAutorizacion') f: string, @Body() b: RideXmlDto) {
    return this.render('factura', f, b);
  }

  @Post('retencion/:fechaAutorizacion')
  @HttpCode(200)
  retencion(@Param('fechaAutorizacion') f: string, @Body() b: RideXmlDto) {
    return this.render('retencion', f, b);
  }

  @Post('credito/:fechaAutorizacion')
  @HttpCode(200)
  credito(@Param('fechaAutorizacion') f: string, @Body() b: RideXmlDto) {
    return this.render('credito', f, b);
  }

  @Post('debito/:fechaAutorizacion')
  @HttpCode(200)
  debito(@Param('fechaAutorizacion') f: string, @Body() b: RideXmlDto) {
    return this.render('debito', f, b);
  }

  @Post('remision/:fechaAutorizacion')
  @HttpCode(200)
  remision(@Param('fechaAutorizacion') f: string, @Body() b: RideXmlDto) {
    return this.render('remision', f, b);
  }

  @Post('liquidacion/:fechaAutorizacion')
  @HttpCode(200)
  liquidacion(@Param('fechaAutorizacion') f: string, @Body() b: RideXmlDto) {
    return this.render('liquidacion', f, b);
  }

  @Post('retencion2/:fechaAutorizacion')
  @HttpCode(200)
  retencion2(@Param('fechaAutorizacion') f: string, @Body() b: RideXmlDto) {
    return this.render('retencion2', f, b);
  }
}
