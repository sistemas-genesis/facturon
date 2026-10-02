import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../tenants/current-tenant.decorator.js';
import { TenantGuard } from '../tenants/tenant.guard.js';
import type { Tenant } from '../tenants/tenant.types.js';
import { UploaderService } from './uploader.service.js';

/** Todas responden 200 vacio de inmediato; el proceso continua en segundo plano. */
@ApiTags('UploaderFacturas')
@Controller('api')
@UseGuards(TenantGuard)
export class UploaderController {
  constructor(private readonly uploader: UploaderService) {}

  @Get('getFacturaCompra/:db/:sesion')
  async compra(
    @CurrentTenant() t: Tenant,
    @Param('sesion') sesion: string,
  ): Promise<void> {
    await this.uploader.compra(t, sesion);
  }

  @Get('getFacturaCompraIndividual/:db/:sesion/:clave_acceso')
  compraIndividual(
    @CurrentTenant() t: Tenant,
    @Param('sesion') sesion: string,
    @Param('clave_acceso') clave: string,
  ): void {
    this.uploader.compraIndividual(t, sesion, clave);
  }

  @Get('getFacturaVentaIndividual/:db/:sesion/:clave_acceso')
  ventaIndividual(
    @CurrentTenant() t: Tenant,
    @Param('sesion') sesion: string,
    @Param('clave_acceso') clave: string,
  ): void {
    this.uploader.ventaIndividual(t, sesion, clave);
  }
}
