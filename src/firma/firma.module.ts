import { Module } from '@nestjs/common';
import { FirmaController } from './firma.controller.js';
import { FirmaService } from './firma.service.js';

@Module({ controllers: [FirmaController], providers: [FirmaService] })
export class FirmaModule {}
