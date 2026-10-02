import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { parseXml } from '../common/sri-xml.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
import type { Tenant } from '../tenants/tenant.types.js';

/** Cliente SOAP del web service de autorizacion offline del SRI. */
@Injectable()
export class SriClient {
  constructor(private readonly settings: TenantSettings) {}

  /** Respuesta SOAP cruda de autorizacionComprobante para esa clave de acceso. */
  async autorizacionComprobante(
    tenant: Tenant,
    claveAcceso: string,
  ): Promise<string> {
    const endpoint = this.settings.for(tenant).soap.replace('?wsdl', '');
    const envelope =
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">' +
      '<soapenv:Header/><soapenv:Body><ec:autorizacionComprobante>' +
      `<claveAccesoComprobante>${escapeXml(claveAcceso)}</claveAccesoComprobante>` +
      '</ec:autorizacionComprobante></soapenv:Body></soapenv:Envelope>';
    const response = await axios.post(endpoint, envelope, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '' },
      timeout: 30_000,
    });
    return response.data;
  }

  /** XML del comprobante (el CDATA <comprobante>) ya parseado, a partir de la respuesta SOAP. */
  async comprobante(
    tenant: Tenant,
    claveAcceso: string,
  ): Promise<Record<string, any>> {
    const soap = await parseXml(
      await this.autorizacionComprobante(tenant, claveAcceso),
    );
    const inner =
      soap['soap:Envelope']['soap:Body'][0][
        'ns2:autorizacionComprobanteResponse'
      ][0].RespuestaAutorizacionComprobante[0].autorizaciones[0].autorizacion[0]
        .comprobante[0];
    return parseXml(inner);
  }
}

function escapeXml(s: string): string {
  return s.replace(
    /[<>&'"]/g,
    (c) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      })[c]!,
  );
}
