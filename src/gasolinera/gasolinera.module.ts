import { Module } from '@nestjs/common';
import { GasolineraController } from './gasolinera.controller.js';
import { GasolineraService } from './gasolinera.service.js';

@Module({ controllers: [GasolineraController], providers: [GasolineraService] })
export class GasolineraModule {}
