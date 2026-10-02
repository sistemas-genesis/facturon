var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../tenants/current-tenant.decorator.js';
import { TenantGuard } from '../tenants/tenant.guard.js';
import { MailService } from './mail.service.js';
let MailController = class MailController {
    mail;
    constructor(mail) {
        this.mail = mail;
    }
    async mail_(tenant, ceId, mails) {
        await this.mail.enviar(tenant, ceId, mails);
    }
};
__decorate([
    Get(':db/:ce_id/:mails'),
    __param(0, CurrentTenant()),
    __param(1, Param('ce_id')),
    __param(2, Param('mails')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "mail_", null);
MailController = __decorate([
    ApiTags('Mail'),
    Controller('api/mail'),
    UseGuards(TenantGuard),
    __metadata("design:paramtypes", [MailService])
], MailController);
export { MailController };
//# sourceMappingURL=mail.controller.js.map