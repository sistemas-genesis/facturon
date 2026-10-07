import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RideModule } from '../ride/ride.module.js';
import { MailController, WhatsAppController } from './mail.controller.js';
import { MailTaskService } from './mail-task.service.js';
import { MailService } from './mail.service.js';
import { WhatsAppService } from './whatsapp.service.js';

@Module({
  imports: [ScheduleModule.forRoot(), RideModule],
  controllers: [MailController, WhatsAppController],
  providers: [MailService, MailTaskService, WhatsAppService],
  exports: [MailService],
})
export class MailModule {}
