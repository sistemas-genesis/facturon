import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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

@ApiTags('WhatsApp')
@Controller('api/whatsapp')
@UseGuards(TenantGuard)
export class WhatsAppController {
  constructor(private readonly mail: MailService) {}

  /** Envia el comprobante ce_id SOLO por WhatsApp (sin correo). `?phone=` opcional. 200 vacio o error con mensaje. */
  @Get(':db/:ce_id')
  async whatsapp_(
    @CurrentTenant() tenant: Tenant,
    @Param('ce_id') ceId: string,
    @Query('phone') phone?: string,
  ): Promise<void> {
    await this.mail.enviarWhatsApp(tenant, ceId, phone);
  }
}
