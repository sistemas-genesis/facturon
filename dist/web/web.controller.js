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
import { Controller, Get, Inject, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { resolve } from 'path';
import { APP_CONFIG } from '../config/app-config.js';
let WebController = class WebController {
    config;
    constructor(config) {
        this.config = config;
    }
    config_(res) {
        res.sendFile(resolve(this.config.publicDir, 'config.html'));
    }
    index(res) {
        res.sendFile(resolve(this.config.publicDir, 'index.html'));
    }
};
__decorate([
    Get('config'),
    __param(0, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WebController.prototype, "config_", null);
__decorate([
    Get('*path'),
    __param(0, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WebController.prototype, "index", null);
WebController = __decorate([
    ApiExcludeController(),
    Controller(),
    __param(0, Inject(APP_CONFIG)),
    __metadata("design:paramtypes", [Object])
], WebController);
export { WebController };
//# sourceMappingURL=web.controller.js.map