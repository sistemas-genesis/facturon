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
import { Body, Controller, Get, Header, HttpCode, Param, Post, UseGuards, } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../tenants/current-tenant.decorator.js';
import { TenantGuard } from '../tenants/tenant.guard.js';
import { BusquedaDocumentosDto } from './dto.js';
import { DocumentosService } from './documentos.service.js';
let DocumentosController = class DocumentosController {
    documentos;
    constructor(documentos) {
        this.documentos = documentos;
    }
    get(tenant, cedulaRuc, start, end, body) {
        return this.documentos.buscarPorComprador(tenant, cedulaRuc, start, end, body);
    }
    getLike(tenant, start, end, body) {
        return this.documentos.buscarTodos(tenant, start, end, body);
    }
    getXmlById(tenant, id) {
        return this.documentos.xmlPorId(tenant, id);
    }
};
__decorate([
    Post('documento/:cedula_ruc&:start&:end&:db'),
    HttpCode(200),
    __param(0, CurrentTenant()),
    __param(1, Param('cedula_ruc')),
    __param(2, Param('start')),
    __param(3, Param('end')),
    __param(4, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, BusquedaDocumentosDto]),
    __metadata("design:returntype", void 0)
], DocumentosController.prototype, "get", null);
__decorate([
    Post('documentoLike/:start&:end&:db'),
    HttpCode(200),
    __param(0, CurrentTenant()),
    __param(1, Param('start')),
    __param(2, Param('end')),
    __param(3, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, BusquedaDocumentosDto]),
    __metadata("design:returntype", void 0)
], DocumentosController.prototype, "getLike", null);
__decorate([
    Get('getXmlById/:db/:id'),
    Header('Content-Type', 'application/xml; charset=utf-8'),
    __param(0, CurrentTenant()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DocumentosController.prototype, "getXmlById", null);
DocumentosController = __decorate([
    ApiTags('Documentos'),
    Controller('api'),
    UseGuards(TenantGuard),
    __metadata("design:paramtypes", [DocumentosService])
], DocumentosController);
export { DocumentosController };
//# sourceMappingURL=documentos.controller.js.map