var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { randomUUID } from 'crypto';
import { ClsModule } from 'nestjs-cls';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { LoggingInterceptor } from './common/logging.interceptor.js';
import { AppConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { DocumentosModule } from './documentos/documentos.module.js';
import { GasolineraModule } from './gasolinera/gasolinera.module.js';
import { GenesisModule } from './genesis/genesis.module.js';
import { HealthModule } from './health/health.module.js';
import { MailModule } from './mail/mail.module.js';
import { ParamsModule } from './params/params.module.js';
import { PdfModule } from './pdf/pdf.module.js';
import { RideModule } from './ride/ride.module.js';
import { UploaderModule } from './uploader/uploader.module.js';
import { WebModule } from './web/web.module.js';
import { LoggerModule } from './logger/logger.module.js';
import { TenantsModule } from './tenants/tenants.module.js';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            AppConfigModule,
            ClsModule.forRoot({
                global: true,
                middleware: {
                    mount: true,
                    generateId: true,
                    idGenerator: (req) => (typeof req.headers['x-request-id'] === 'string' &&
                        req.headers['x-request-id']) ||
                        randomUUID(),
                },
            }),
            LoggerModule,
            TenantsModule,
            DatabaseModule,
            HealthModule,
            DocumentosModule,
            RideModule,
            MailModule,
            GenesisModule,
            UploaderModule,
            GasolineraModule,
            ParamsModule,
            PdfModule,
            WebModule,
        ],
        providers: [
            { provide: APP_FILTER, useClass: AllExceptionsFilter },
            { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
        ],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map