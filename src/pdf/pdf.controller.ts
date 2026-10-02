import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { RideService } from '../ride/ride.service.js';

/** GET /api/pdf/:file: descarga un RIDE generado (<claveAcceso>.pdf). Solo sirve archivos de la carpeta de PDF. */
@ApiTags('PDF')
@Controller('api/pdf')
export class PdfController {
  constructor(private readonly ride: RideService) {}

  @Get(':file')
  download(@Param('file') file: string, @Res() res: Response) {
    const path = this.ride.resolvePdf(file);
    if (!path) throw new NotFoundException('PDF no disponible');
    res.download(path, file);
  }
}
