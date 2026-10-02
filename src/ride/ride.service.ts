import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import bwipjs from 'bwip-js';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { join, resolve } from 'path';
import { createRequire } from 'module';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { parseXml, type RideTipo } from '../common/sri-xml.js';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantContext } from '../tenants/tenant-context.service.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import type { Tenant } from '../tenants/tenant.types.js';
import {
  buildCredito,
  buildDebito,
  buildFactura,
  buildLiquidacion,
  buildRemision,
  buildRetencion,
  buildRetencion2,
} from './ride-builders.js';

// pdfmake 0.2 es CommonJS y sus tipos no declaran el constructor
const PdfPrinter = createRequire(import.meta.url)('pdfmake');

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

/** Nodo raiz del XML y constructor del documento para cada tipo de RIDE. */
const BUILDERS: Record<RideTipo, { root: string; build: Function }> = {
  factura: { root: 'factura', build: buildFactura },
  retencion: { root: 'comprobanteRetencion', build: buildRetencion },
  retencion2: { root: 'comprobanteRetencion', build: buildRetencion2 },
  credito: { root: 'notaCredito', build: buildCredito },
  debito: { root: 'notaDebito', build: buildDebito },
  remision: { root: 'guiaRemision', build: buildRemision },
  liquidacion: { root: 'liquidacionCompra', build: buildLiquidacion },
};

export interface RideResult {
  /** Nombre del PDF (`<claveAcceso>.pdf`), descargable en GET /api/pdf/:file. */
  file: string;
  /** Ruta absoluta del PDF en disco. */
  path: string;
  tenant: Tenant;
}

@Injectable()
export class RideService implements OnModuleInit {
  private readonly printer = new PdfPrinter(fonts);
  readonly pdfDir: string;

  constructor(
    @Inject(APP_CONFIG) config: AppConfig,
    private readonly settings: TenantSettings,
    private readonly registry: TenantRegistry,
    private readonly tenantContext: TenantContext,
    private readonly logger: TenantLoggerService,
  ) {
    this.pdfDir = resolve(config.pdfDir);
    this.pdfTtlMs = config.pdfTtlMs;
  }
  private readonly pdfTtlMs: number;

  onModuleInit() {
    mkdirSync(this.pdfDir, { recursive: true });
  }

  /**
   * Genera el PDF del RIDE a partir del XML. La empresa se identifica por el RUC (y
   * establecimiento/punto) del propio XML y queda registrada en el contexto del request.
   */
  async generate(
    tipo: RideTipo,
    xml: string,
    fechaAutorizacion: string,
  ): Promise<RideResult> {
    const spec = BUILDERS[tipo];
    let parsed: Record<string, any>;
    try {
      parsed = await parseXml(xml);
    } catch {
      throw new BadRequestException('XML invalido');
    }
    const node = parsed?.[spec.root];
    if (!node?.infoTributaria?.[0])
      throw new HttpException(
        `El XML no corresponde a un documento '${tipo}'`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    const it = node.infoTributaria[0];
    const tenant = this.registry.selectByRuc(
      it.ruc?.[0],
      it.estab?.[0],
      it.ptoEmi?.[0],
    );
    if (!tenant)
      throw new HttpException(
        `No hay empresa configurada para el RUC ${it.ruc?.[0]}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    this.tenantContext.bind(tenant);

    const started = Date.now();
    try {
      const { doc, clave } = await spec.build(
        node,
        fechaAutorizacion,
        this.envFor(tenant),
      );
      const file = `${this.safeName(clave)}.pdf`;
      const path = join(this.pdfDir, file);
      await this.write(doc, path);
      setTimeout(
        () => unlink(path).catch(() => undefined),
        this.pdfTtlMs,
      ).unref();
      this.logger.operation(tenant, `ride.${tipo}`, 'ok', {
        claveAcceso: clave,
        file,
        ms: Date.now() - started,
      });
      return { file, path, tenant };
    } catch (e) {
      this.logger.operation(tenant, `ride.${tipo}`, 'error', {
        claveAcceso: it.claveAcceso?.[0],
        err: e instanceof Error ? e : new Error(String(e)),
      });
      throw e instanceof HttpException
        ? e
        : new HttpException(
            'No se pudo generar el RIDE',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
    }
  }

  /** Ruta de un PDF ya generado; solo nombres `<clave>.pdf` dentro de pdfDir. */
  resolvePdf(file: string): string | undefined {
    if (!/^[A-Za-z0-9_-]{1,100}\.pdf$/.test(file)) return undefined;
    const path = join(this.pdfDir, file);
    return existsSync(path) ? path : undefined;
  }

  /** Entorno que reciben los constructores: configuracion de ESA empresa o la global. */
  private envFor(tenant: Tenant) {
    const cfg = this.settings.for(tenant);
    return {
      RIDE: cfg.RIDE,
      sri: cfg.sri,
      findTenant: (ruc: string, estab?: string, ptoEmi?: string) =>
        this.registry.selectByRuc(ruc, estab, ptoEmi) ?? tenant,
      getBarcode: (clave: string) => this.barcode(clave),
      getLeyendaCatastro: (node: Record<string, any>) =>
        this.leyendaCatastro(node),
    };
  }

  private async barcode(claveAcceso: string): Promise<string> {
    const buffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: claveAcceso,
      scale: 3,
      height: 10,
      textxalign: 'center',
    });
    return `data:image/gif;base64,${buffer.toString('base64')}`;
  }

  /** utilities.getLeyendaCatastro del legacy, leyendo la config de la empresa dueña del RUC. */
  private leyendaCatastro(comprobante: Record<string, any>) {
    const it = comprobante.infoTributaria[0];
    const tenant = this.registry.findByRuc(it.ruc[0])[0];
    const cfg = tenant?.leyenda_catastro;
    let leyenda = { size: 0, text: '' };
    if (cfg?.status && typeof comprobante.infoAdicional !== 'undefined') {
      const campos: any[] = comprobante.infoAdicional[0].campoAdicional;
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
        text:
          leyenda.text +
          'AGENTE DE RETENCION SEGUN RESOLUCION NO NAC-DNCRASC20-00000001',
      };
    if (typeof it.contribuyenteRimpe !== 'undefined') {
      if (leyenda.text != '')
        leyenda.text += ' <br> CONTRIBUYENTE REGIMEN RIMPE';
      else leyenda = { size, text: 'CONTRIBUYENTE REGIMEN RIMPE' };
    }
    if (typeof it.regimenMicroempresas !== 'undefined')
      leyenda = { size, text: it.regimenMicroempresas[0] + '.' };
    return leyenda;
  }

  private safeName(clave: unknown): string {
    const s = String(clave ?? '').replace(/[^A-Za-z0-9_-]/g, '');
    return s || `ride-${Date.now()}`;
  }

  private write(docDefinition: unknown, path: string): Promise<void> {
    return new Promise((resolveWrite, reject) => {
      const doc = this.printer.createPdfKitDocument(docDefinition as never);
      const stream = createWriteStream(path);
      doc.pipe(stream);
      stream.on('finish', () => resolveWrite());
      stream.on('error', reject);
      doc.on('error', reject);
      doc.end();
    });
  }
}
