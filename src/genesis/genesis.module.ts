import { Module } from '@nestjs/common';
import { RideModule } from '../ride/ride.module.js';
import { GenesisController } from './genesis.controller.js';
import { GenesisService } from './genesis.service.js';

@Module({
  imports: [RideModule],
  controllers: [GenesisController],
  providers: [GenesisService],
})
export class GenesisModule {}
