var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import moment from 'moment';
import { resolve } from 'path';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import { certFromP12, openssl, OpenSslError, parseOpensslDate, } from './openssl.js';
let FirmaService = class FirmaService {
    registry;
    logger;
    constructor(registry, logger) {
        this.registry = registry;
        this.logger = logger;
    }
    async diasParaCaducar(ruc) {
        const tenant = this.registry.selectByRuc(ruc);
        if (!tenant)
            throw new NotFoundException('Empresa no encontrada');
        if (tenant.firma.path == '')
            return undefined;
        return this.logger.audited(tenant, 'firma.fecha_caducidad', async () => {
            const pfx = await readFile(resolve(tenant.firma.path));
            const pem = await certFromP12(pfx, tenant.firma.pass);
            const end = parseOpensslDate(await openssl(['x509', '-enddate', '-noout'], { stdin: pem }), 'notAfter');
            const difference = moment(end, 'YYYY-MM-DD').diff(moment(), 'days') + tenant.firma.add;
            return difference.toString();
        }, (dias) => ({ dias }));
    }
    async info(firma, pass) {
        try {
            const b64 = firma.split(',')[1];
            if (!b64)
                return { success: false, msg: 'Archivo de firma invalido' };
            const pem = await certFromP12(Buffer.from(b64, 'base64'), pass);
            const x509 = (args) => openssl(['x509', ...args], { stdin: pem });
            const end = parseOpensslDate(await x509(['-enddate', '-noout']), 'notAfter');
            const start = parseOpensslDate(await x509(['-startdate', '-noout']), 'notBefore');
            return {
                success: true,
                data: {
                    enddate: end,
                    diff: moment(end, 'YYYY-MM-DD').diff(moment(), 'days'),
                    startdate: start,
                    subject: await x509(['-subject', '-noout']),
                    rest: await x509([
                        '-text',
                        '-noout',
                        '-certopt',
                        'no_subject,no_header,no_version,no_serial,no_signame,no_validity,no_issuer,no_pubkey,no_sigdump,no_aux',
                    ]),
                },
            };
        }
        catch (e) {
            if (e instanceof OpenSslError &&
                /invalid password|Mac verify error/i.test(e.stderr))
                return {
                    success: false,
                    msg: 'La contraseña de la firma es incorrecta',
                };
            return {
                success: false,
                msg: e instanceof OpenSslError
                    ? e.stderr.trim() || e.message
                    : e.message,
            };
        }
    }
};
FirmaService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TenantRegistry,
        TenantLoggerService])
], FirmaService);
export { FirmaService };
//# sourceMappingURL=firma.service.js.map