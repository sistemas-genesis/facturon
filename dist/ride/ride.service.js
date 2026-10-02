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
import { HttpException, HttpStatus, Inject, Injectable, BadRequestException, } from '@nestjs/common';
import bwipjs from 'bwip-js';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { join, resolve } from 'path';
import { createRequire } from 'module';
import { APP_CONFIG } from '../config/app-config.js';
import { parseXml } from '../common/sri-xml.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantContext } from '../tenants/tenant-context.service.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import { buildCredito, buildDebito, buildFactura, buildLiquidacion, buildRemision, buildRetencion, buildRetencion2, } from './ride-builders.js';
const PdfPrinter = createRequire(import.meta.url)('pdfmake');
const fonts = {
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
    },
};
const BUILDERS = {
    factura: { root: 'factura', build: buildFactura },
    retencion: { root: 'comprobanteRetencion', build: buildRetencion },
    retencion2: { root: 'comprobanteRetencion', build: buildRetencion2 },
    credito: { root: 'notaCredito', build: buildCredito },
    debito: { root: 'notaDebito', build: buildDebito },
    remision: { root: 'guiaRemision', build: buildRemision },
    liquidacion: { root: 'liquidacionCompra', build: buildLiquidacion },
};
let RideService = class RideService {
    settings;
    registry;
    tenantContext;
    logger;
    printer = new PdfPrinter(fonts);
    pdfDir;
    constructor(config, settings, registry, tenantContext, logger) {
        this.settings = settings;
        this.registry = registry;
        this.tenantContext = tenantContext;
        this.logger = logger;
        this.pdfDir = resolve(config.pdfDir);
        this.pdfTtlMs = config.pdfTtlMs;
    }
    pdfTtlMs;
    onModuleInit() {
        mkdirSync(this.pdfDir, { recursive: true });
    }
    async generate(tipo, xml, fechaAutorizacion) {
        const spec = BUILDERS[tipo];
        let parsed;
        try {
            parsed = await parseXml(xml);
        }
        catch {
            throw new BadRequestException('XML invalido');
        }
        const node = parsed?.[spec.root];
        if (!node?.infoTributaria?.[0])
            throw new HttpException(`El XML no corresponde a un documento '${tipo}'`, HttpStatus.INTERNAL_SERVER_ERROR);
        const it = node.infoTributaria[0];
        const tenant = this.registry.selectByRuc(it.ruc?.[0], it.estab?.[0], it.ptoEmi?.[0]);
        if (!tenant)
            throw new HttpException(`No hay empresa configurada para el RUC ${it.ruc?.[0]}`, HttpStatus.INTERNAL_SERVER_ERROR);
        this.tenantContext.bind(tenant);
        const started = Date.now();
        try {
            const { doc, clave } = await spec.build(node, fechaAutorizacion, this.envFor(tenant));
            const file = `${this.safeName(clave)}.pdf`;
            const path = join(this.pdfDir, file);
            await this.write(doc, path);
            setTimeout(() => unlink(path).catch(() => undefined), this.pdfTtlMs).unref();
            this.logger.operation(tenant, `ride.${tipo}`, 'ok', {
                claveAcceso: clave,
                file,
                ms: Date.now() - started,
            });
            return { file, path, tenant };
        }
        catch (e) {
            this.logger.operation(tenant, `ride.${tipo}`, 'error', {
                claveAcceso: it.claveAcceso?.[0],
                err: e instanceof Error ? e : new Error(String(e)),
            });
            throw e instanceof HttpException
                ? e
                : new HttpException('No se pudo generar el RIDE', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    resolvePdf(file) {
        if (!/^[A-Za-z0-9_-]{1,100}\.pdf$/.test(file))
            return undefined;
        const path = join(this.pdfDir, file);
        return existsSync(path) ? path : undefined;
    }
    envFor(tenant) {
        const cfg = this.settings.for(tenant);
        return {
            RIDE: cfg.RIDE,
            sri: cfg.sri,
            findTenant: (ruc, estab, ptoEmi) => this.registry.selectByRuc(ruc, estab, ptoEmi) ?? tenant,
            getBarcode: (clave) => this.barcode(clave),
            getLeyendaCatastro: (node) => this.leyendaCatastro(node),
        };
    }
    async barcode(claveAcceso) {
        const buffer = await bwipjs.toBuffer({
            bcid: 'code128',
            text: claveAcceso,
            scale: 3,
            height: 10,
            textxalign: 'center',
        });
        return `data:image/gif;base64,${buffer.toString('base64')}`;
    }
    leyendaCatastro(comprobante) {
        const it = comprobante.infoTributaria[0];
        const tenant = this.registry.findByRuc(it.ruc[0])[0];
        const cfg = tenant?.leyenda_catastro;
        let leyenda = { size: 0, text: '' };
        if (cfg?.status && typeof comprobante.infoAdicional !== 'undefined') {
            const campos = comprobante.infoAdicional[0].campoAdicional;
            const idx = campos.findIndex((c) => c['$']?.nombre == cfg.key);
            if (idx >= 0)
                leyenda = {
                    size: cfg.size,
                    text: campos[idx]['_'].replace(cfg.breakLine, '<br>'),
                };
        }
        const size = cfg?.size ?? 0;
        if (typeof it.agenteRetencion !== 'undefined')
            leyenda = {
                size,
                text: leyenda.text +
                    'AGENTE DE RETENCION SEGUN RESOLUCION NO NAC-DNCRASC20-00000001',
            };
        if (typeof it.contribuyenteRimpe !== 'undefined') {
            if (leyenda.text != '')
                leyenda.text += ' <br> CONTRIBUYENTE REGIMEN RIMPE';
            else
                leyenda = { size, text: 'CONTRIBUYENTE REGIMEN RIMPE' };
        }
        if (typeof it.regimenMicroempresas !== 'undefined')
            leyenda = { size, text: it.regimenMicroempresas[0] + '.' };
        return leyenda;
    }
    safeName(clave) {
        const s = String(clave ?? '').replace(/[^A-Za-z0-9_-]/g, '');
        return s || `ride-${Date.now()}`;
    }
    write(docDefinition, path) {
        return new Promise((resolveWrite, reject) => {
            const doc = this.printer.createPdfKitDocument(docDefinition);
            const stream = createWriteStream(path);
            doc.pipe(stream);
            stream.on('finish', () => resolveWrite());
            stream.on('error', reject);
            doc.on('error', reject);
            doc.end();
        });
    }
};
RideService = __decorate([
    Injectable(),
    __param(0, Inject(APP_CONFIG)),
    __metadata("design:paramtypes", [Object, TenantSettings,
        TenantRegistry,
        TenantContext,
        TenantLoggerService])
], RideService);
export { RideService };
//# sourceMappingURL=ride.service.js.map