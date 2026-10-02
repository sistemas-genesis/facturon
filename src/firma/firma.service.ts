import { Injectable, NotFoundException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import moment from 'moment';
import { resolve } from 'path';
import { TenantLoggerService } from '../logger/tenant-logger.service.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import {
  certFromP12,
  openssl,
  OpenSslError,
  parseOpensslDate,
} from './openssl.js';

export interface FirmaInfo {
  enddate: string;
  diff: number;
  startdate: string;
  subject: string;
  rest: string;
}

@Injectable()
export class FirmaService {
  constructor(
    private readonly registry: TenantRegistry,
    private readonly logger: TenantLoggerService,
  ) {}

  /**
   * Dias que faltan para vencer la firma de la empresa con ese RUC (+ firma.add).
   * Devuelve undefined si la empresa no tiene firma configurada (respuesta vacia, como el legacy).
   */
  async diasParaCaducar(ruc: string): Promise<string | undefined> {
    const tenant = this.registry.selectByRuc(ruc);
    if (!tenant) throw new NotFoundException('Empresa no encontrada');
    if (tenant.firma.path == '') return undefined;
    return this.logger.audited(
      tenant,
      'firma.fecha_caducidad',
      async () => {
        const pfx = await readFile(resolve(tenant.firma.path));
        const pem = await certFromP12(pfx, tenant.firma.pass);
        const end = parseOpensslDate(
          await openssl(['x509', '-enddate', '-noout'], { stdin: pem }),
          'notAfter',
        );
        const difference =
          moment(end, 'YYYY-MM-DD').diff(moment(), 'days') + tenant.firma.add;
        return difference.toString();
      },
      (dias) => ({ dias }),
    );
  }

  /** Datos de una firma electronica subida por el usuario (no queda en disco ni en logs). */
  async info(
    firma: string,
    pass: string,
  ): Promise<
    { success: true; data: FirmaInfo } | { success: false; msg: string }
  > {
    try {
      const b64 = firma.split(',')[1];
      if (!b64) return { success: false, msg: 'Archivo de firma invalido' };
      const pem = await certFromP12(Buffer.from(b64, 'base64'), pass);
      const x509 = (args: string[]) =>
        openssl(['x509', ...args], { stdin: pem });

      const end = parseOpensslDate(
        await x509(['-enddate', '-noout']),
        'notAfter',
      );
      const start = parseOpensslDate(
        await x509(['-startdate', '-noout']),
        'notBefore',
      );
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
    } catch (e) {
      if (
        e instanceof OpenSslError &&
        /invalid password|Mac verify error/i.test(e.stderr)
      )
        return {
          success: false,
          msg: 'La contraseña de la firma es incorrecta',
        };
      return {
        success: false,
        msg:
          e instanceof OpenSslError
            ? e.stderr.trim() || e.message
            : (e as Error).message,
      };
    }
  }
}
