var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { RideModule } from '../ride/ride.module.js';
import { GenesisController } from './genesis.controller.js';
import { GenesisService } from './genesis.service.js';
let GenesisModule = class GenesisModule {
};
GenesisModule = __decorate([
    Module({
        imports: [RideModule],
        controllers: [GenesisController],
        providers: [GenesisService],
    })
], GenesisModule);
export { GenesisModule };
//# sourceMappingURL=genesis.module.js.map