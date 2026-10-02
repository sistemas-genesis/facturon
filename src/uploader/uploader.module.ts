import { Module } from '@nestjs/common';
import { SriClient } from './sri-client.service.js';
import { UploaderController } from './uploader.controller.js';
import { UploaderService } from './uploader.service.js';

@Module({
  controllers: [UploaderController],
  providers: [UploaderService, SriClient],
})
export class UploaderModule {}
