import type { Tenant } from '../tenants/tenant.types.js';
import { MailService } from './mail.service.js';
export declare class MailController {
    private readonly mail;
    constructor(mail: MailService);
    mail_(tenant: Tenant, ceId: string, mails: string): Promise<void>;
}
