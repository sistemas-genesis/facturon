import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../tenants/current-tenant.decorator.js';
import { TenantGuard } from '../tenants/tenant.guard.js';
import type { Tenant } from '../tenants/tenant.types.js';
import { MailService } from './mail.service.js';

@ApiTags('Mail')
@Controller('api/mail')
@UseGuards(TenantGuard)
export class MailController {
  constructor(private readonly mail: MailService) {}

  /** Envia el comprobante ce_id al/los correos `mails` (separados por coma). Responde 200 vacio. */
  @Get(':db/:ce_id/:mails')
  async mail_(
    @CurrentTenant() tenant: Tenant,
    @Param('ce_id') ceId: string,
    @Param('mails') mails: string,
  ): Promise<void> {
    await this.mail.enviar(tenant, ceId, mails);
  }
}
