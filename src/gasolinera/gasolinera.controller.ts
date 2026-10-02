import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../tenants/current-tenant.decorator.js';
import { TenantGuard } from '../tenants/tenant.guard.js';
import type { Tenant } from '../tenants/tenant.types.js';
import { GasolineraService } from './gasolinera.service.js';

@ApiTags('Gasolinera')
@Controller('api/persona')
@UseGuards(TenantGuard)
export class GasolineraController {
  constructor(private readonly gasolinera: GasolineraService) {}

  @Get(':db/:cedula')
  persona(@CurrentTenant() tenant: Tenant, @Param('cedula') cedula: string) {
    return this.gasolinera.persona(tenant, cedula);
  }
}
