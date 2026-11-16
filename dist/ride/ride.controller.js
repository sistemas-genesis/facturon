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
import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RideXmlDto } from './dto.js';
import { RideService } from './ride.service.js';
let RideController = class RideController {
    ride;
    constructor(ride) {
        this.ride = ride;
    }
    async render(tipo, fecha, body) {
        return (await this.ride.generate(tipo, body.xml, fecha)).file;
    }
    factura(f, b) {
        return this.render('factura', f, b);
    }
    retencion(f, b) {
        return this.render('retencion', f, b);
    }
    credito(f, b) {
        return this.render('credito', f, b);
    }
    debito(f, b) {
        return this.render('debito', f, b);
    }
    remision(f, b) {
        return this.render('remision', f, b);
    }
    liquidacion(f, b) {
        return this.render('liquidacion', f, b);
    }
    retencion2(f, b) {
        return this.render('retencion2', f, b);
    }
};
__decorate([
    Post('factura/:fechaAutorizacion'),
    HttpCode(200),
    __param(0, Param('fechaAutorizacion')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RideXmlDto]),
    __metadata("design:returntype", void 0)
], RideController.prototype, "factura", null);
__decorate([
    Post('retencion/:fechaAutorizacion'),
    HttpCode(200),
    __param(0, Param('fechaAutorizacion')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RideXmlDto]),
    __metadata("design:returntype", void 0)
], RideController.prototype, "retencion", null);
__decorate([
    Post('credito/:fechaAutorizacion'),
    HttpCode(200),
    __param(0, Param('fechaAutorizacion')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RideXmlDto]),
    __metadata("design:returntype", void 0)
], RideController.prototype, "credito", null);
__decorate([
    Post('debito/:fechaAutorizacion'),
    HttpCode(200),
    __param(0, Param('fechaAutorizacion')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RideXmlDto]),
    __metadata("design:returntype", void 0)
], RideController.prototype, "debito", null);
__decorate([
    Post('remision/:fechaAutorizacion'),
    HttpCode(200),
    __param(0, Param('fechaAutorizacion')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RideXmlDto]),
    __metadata("design:returntype", void 0)
], RideController.prototype, "remision", null);
__decorate([
    Post('liquidacion/:fechaAutorizacion'),
    HttpCode(200),
    __param(0, Param('fechaAutorizacion')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RideXmlDto]),
    __metadata("design:returntype", void 0)
], RideController.prototype, "liquidacion", null);
__decorate([
    Post('retencion2/:fechaAutorizacion'),
    HttpCode(200),
    __param(0, Param('fechaAutorizacion')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RideXmlDto]),
    __metadata("design:returntype", void 0)
], RideController.prototype, "retencion2", null);
RideController = __decorate([
    ApiTags('RIDE'),
    Controller('api/documento/ride'),
    __metadata("design:paramtypes", [RideService])
], RideController);
export { RideController };
//# sourceMappingURL=ride.controller.js.map