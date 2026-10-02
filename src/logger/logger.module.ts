import { Global, Module } from '@nestjs/common';
import { TenantLoggerService } from './tenant-logger.service.js';

@Global()
@Module({
  providers: [TenantLoggerService],
  exports: [TenantLoggerService],
})
export class LoggerModule {}
