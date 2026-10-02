import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly registry: TenantRegistry) {}

  @Get()
  check() {
    const tenants = this.registry.list();
    return {
      status: 'ok',
      uptimeSec: Math.round(process.uptime()),
      tenants: {
        total: tenants.length,
        enabled: tenants.filter((t) => t.enabled).length,
      },
    };
  }
}
