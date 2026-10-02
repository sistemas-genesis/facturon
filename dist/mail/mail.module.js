var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RideModule } from '../ride/ride.module.js';
import { MailController } from './mail.controller.js';
import { MailTaskService } from './mail-task.service.js';
import { MailService } from './mail.service.js';
import { WhatsAppService } from './whatsapp.service.js';
let MailModule = class MailModule {
};
MailModule = __decorate([
    Module({
        imports: [ScheduleModule.forRoot(), RideModule],
        controllers: [MailController],
        providers: [MailService, MailTaskService, WhatsAppService],
        exports: [MailService],
    })
], MailModule);
export { MailModule };
//# sourceMappingURL=mail.module.js.map