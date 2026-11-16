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
import { GenesisService } from './genesis.service.js';
let GenesisController = class GenesisController {
    genesis;
    constructor(genesis) {
        this.genesis = genesis;
    }
    async ride(tenant, clave) {
        await this.genesis.ride_(tenant, clave);
    }
    rideBlob(tenant, clave) {
        return this.genesis.rideBlob(tenant, clave);
    }
};
__decorate([
    Get('ride/:db/:clave_acceso'),
    __param(0, CurrentTenant()),
    __param(1, Param('clave_acceso')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GenesisController.prototype, "ride", null);
__decorate([
    Get('ride_blob/:db/:clave_acceso'),
    __param(0, CurrentTenant()),
    __param(1, Param('clave_acceso')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GenesisController.prototype, "rideBlob", null);
GenesisController = __decorate([
    ApiTags('Genesis'),
    Controller('api/genesis'),
    UseGuards(TenantGuard),
    __metadata("design:paramtypes", [GenesisService])
], GenesisController);
export { GenesisController };
//# sourceMappingURL=genesis.controller.js.map