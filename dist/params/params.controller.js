var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParamsService } from './params.service.js';
let ParamsController = class ParamsController {
    params;
    constructor(params) {
        this.params = params;
    }
    empresas() {
        return this.params.empresas();
    }
    config() {
        return this.params.panelConfig();
    }
    publicip() {
        return this.params.publicip();
    }
};
__decorate([
    Get('empresas'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ParamsController.prototype, "empresas", null);
__decorate([
    Get('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ParamsController.prototype, "config", null);
__decorate([
    Get('publicip'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ParamsController.prototype, "publicip", null);
ParamsController = __decorate([
    ApiTags('Params'),
    Controller('api/params'),
    __metadata("design:paramtypes", [ParamsService])
], ParamsController);
export { ParamsController };
//# sourceMappingURL=params.controller.js.map