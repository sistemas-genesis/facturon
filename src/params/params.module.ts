import { Module } from '@nestjs/common';
import { PublicIpService } from '../publicip/public-ip.service.js';
import { ParamsController } from './params.controller.js';
import { ParamsService } from './params.service.js';

@Module({
  controllers: [ParamsController],
  providers: [ParamsService, PublicIpService],
})
export class ParamsModule {}
