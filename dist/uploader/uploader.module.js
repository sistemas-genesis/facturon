var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { SriClient } from './sri-client.service.js';
import { UploaderController } from './uploader.controller.js';
import { UploaderService } from './uploader.service.js';
let UploaderModule = class UploaderModule {
};
UploaderModule = __decorate([
    Module({
        controllers: [UploaderController],
        providers: [UploaderService, SriClient],
    })
], UploaderModule);
export { UploaderModule };
//# sourceMappingURL=uploader.module.js.map