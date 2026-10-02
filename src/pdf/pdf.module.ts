import { Module } from '@nestjs/common';
import { RideModule } from '../ride/ride.module.js';
import { PdfController } from './pdf.controller.js';

@Module({ imports: [RideModule], controllers: [PdfController] })
export class PdfModule {}
