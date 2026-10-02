import { Global, Module } from '@nestjs/common';
import { DbDriver, SybaseDriver, SybaseService } from './sybase.service.js';

@Global()
@Module({
  providers: [{ provide: DbDriver, useClass: SybaseDriver }, SybaseService],
  exports: [SybaseService, DbDriver],
})
export class DatabaseModule {}
