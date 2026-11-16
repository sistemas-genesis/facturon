var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { parseXml } from '../common/sri-xml.js';
import { TenantSettings } from '../tenants/tenant-settings.service.js';
let SriClient = class SriClient {
    settings;
    constructor(settings) {
        this.settings = settings;
    }
    async autorizacionComprobante(tenant, claveAcceso) {
        const endpoint = this.settings.for(tenant).soap.replace('?wsdl', '');
        const envelope = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">' +
            '<soapenv:Header/><soapenv:Body><ec:autorizacionComprobante>' +
            `<claveAccesoComprobante>${escapeXml(claveAcceso)}</claveAccesoComprobante>` +
            '</ec:autorizacionComprobante></soapenv:Body></soapenv:Envelope>';
        const response = await axios.post(endpoint, envelope, {
            headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '' },
            timeout: 30_000,
        });
        return response.data;
    }
    async comprobante(tenant, claveAcceso) {
        const soap = await parseXml(await this.autorizacionComprobante(tenant, claveAcceso));
        const inner = soap['soap:Envelope']['soap:Body'][0]['ns2:autorizacionComprobanteResponse'][0].RespuestaAutorizacionComprobante[0].autorizaciones[0].autorizacion[0]
            .comprobante[0];
        return parseXml(inner);
    }
};
SriClient = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TenantSettings])
], SriClient);
export { SriClient };
function escapeXml(s) {
    return s.replace(/[<>&'"]/g, (c) => ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
    })[c]);
}
//# sourceMappingURL=sri-client.service.js.map