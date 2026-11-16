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
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../tenants/current-tenant.decorator.js';
import { TenantGuard } from '../tenants/tenant.guard.js';
import { UploaderService } from './uploader.service.js';
let UploaderController = class UploaderController {
    uploader;
    constructor(uploader) {
        this.uploader = uploader;
    }
    async compra(t, sesion) {
        await this.uploader.compra(t, sesion);
    }
    compraIndividual(t, sesion, clave) {
        this.uploader.compraIndividual(t, sesion, clave);
    }
    ventaIndividual(t, sesion, clave) {
        this.uploader.ventaIndividual(t, sesion, clave);
    }
};
__decorate([
    Get('getFacturaCompra/:db/:sesion'),
    __param(0, CurrentTenant()),
    __param(1, Param('sesion')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UploaderController.prototype, "compra", null);
__decorate([
    Get('getFacturaCompraIndividual/:db/:sesion/:clave_acceso'),
    __param(0, CurrentTenant()),
    __param(1, Param('sesion')),
    __param(2, Param('clave_acceso')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], UploaderController.prototype, "compraIndividual", null);
__decorate([
    Get('getFacturaVentaIndividual/:db/:sesion/:clave_acceso'),
    __param(0, CurrentTenant()),
    __param(1, Param('sesion')),
    __param(2, Param('clave_acceso')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], UploaderController.prototype, "ventaIndividual", null);
UploaderController = __decorate([
    ApiTags('UploaderFacturas'),
    Controller('api'),
    UseGuards(TenantGuard),
    __metadata("design:paramtypes", [UploaderService])
], UploaderController);
export { UploaderController };
//# sourceMappingURL=uploader.controller.js.map