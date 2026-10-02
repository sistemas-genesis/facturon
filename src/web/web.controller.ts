import { Controller, Get, Inject, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { resolve } from 'path';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';

/** Front estatico del servicio original: /config y, para cualquier otra ruta GET, index.html. */
@ApiExcludeController()
@Controller()
export class WebController {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  @Get('config')
  config_(@Res() res: Response) {
    res.sendFile(resolve(this.config.publicDir, 'config.html'));
  }

  @Get('*path')
  index(@Res() res: Response) {
    res.sendFile(resolve(this.config.publicDir, 'index.html'));
  }
}
