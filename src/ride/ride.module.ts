import { Module } from '@nestjs/common';
import { RideController } from './ride.controller.js';
import { RideService } from './ride.service.js';

@Module({
  controllers: [RideController],
  providers: [RideService],
  exports: [RideService],
})
export class RideModule {}
