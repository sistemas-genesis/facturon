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
import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FirmaInfoDto } from './dto.js';
import { FirmaService } from './firma.service.js';
let FirmaController = class FirmaController {
    firma;
    constructor(firma) {
        this.firma = firma;
    }
    fechaCaducidad(ruc) {
        return this.firma.diasParaCaducar(ruc);
    }
    info(body) {
        return this.firma.info(body.firma, body.pass);
    }
};
__decorate([
    Get('fecha_caducidad/:ruc'),
    __param(0, Param('ruc')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FirmaController.prototype, "fechaCaducidad", null);
__decorate([
    Post('info'),
    HttpCode(200),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [FirmaInfoDto]),
    __metadata("design:returntype", void 0)
], FirmaController.prototype, "info", null);
FirmaController = __decorate([
    ApiTags('Firma'),
    Controller('api/firma'),
    __metadata("design:paramtypes", [FirmaService])
], FirmaController);
export { FirmaController };
//# sourceMappingURL=firma.controller.js.map