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
import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RideService } from '../ride/ride.service.js';
let PdfController = class PdfController {
    ride;
    constructor(ride) {
        this.ride = ride;
    }
    download(file, res) {
        const path = this.ride.resolvePdf(file);
        if (!path)
            throw new NotFoundException('PDF no disponible');
        res.download(path, file);
    }
};
__decorate([
    Get(':file'),
    __param(0, Param('file')),
    __param(1, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PdfController.prototype, "download", null);
PdfController = __decorate([
    ApiTags('PDF'),
    Controller('api/pdf'),
    __metadata("design:paramtypes", [RideService])
], PdfController);
export { PdfController };
//# sourceMappingURL=pdf.controller.js.map