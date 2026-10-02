import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParamsService } from './params.service.js';

@ApiTags('Params')
@Controller('api/params')
export class ParamsController {
  constructor(private readonly params: ParamsService) {}

  @Get('empresas')
  empresas() {
    return this.params.empresas();
  }

  /** Config que muestra el panel /config (solo lectura, uso local; contrasenas enmascaradas). */
  @Get('config')
  config() {
    return this.params.panelConfig();
  }

  @Get('publicip')
  publicip() {
    return this.params.publicip();
  }
}
