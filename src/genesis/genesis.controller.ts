import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../tenants/current-tenant.decorator.js';
import { TenantGuard } from '../tenants/tenant.guard.js';
import type { Tenant } from '../tenants/tenant.types.js';
import { GenesisService } from './genesis.service.js';

@ApiTags('Genesis')
@Controller('api/genesis')
@UseGuards(TenantGuard)
export class GenesisController {
  constructor(private readonly genesis: GenesisService) {}

  @Get('ride/:db/:clave_acceso')
  async ride(
    @CurrentTenant() tenant: Tenant,
    @Param('clave_acceso') clave: string,
  ): Promise<void> {
    await this.genesis.ride_(tenant, clave);
  }

  @Get('ride_blob/:db/:clave_acceso')
  rideBlob(
    @CurrentTenant() tenant: Tenant,
    @Param('clave_acceso') clave: string,
  ): Promise<string> {
    return this.genesis.rideBlob(tenant, clave);
  }
}
