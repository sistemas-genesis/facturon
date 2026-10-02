var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
class BusquedaParamsDto {
    fecha_autorizacion;
}
__decorate([
    IsOptional(),
    __metadata("design:type", Boolean)
], BusquedaParamsDto.prototype, "fecha_autorizacion", void 0);
export class BusquedaDocumentosDto {
    empresas;
    estacion;
    punto;
    tipos;
    params;
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], BusquedaDocumentosDto.prototype, "empresas", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], BusquedaDocumentosDto.prototype, "estacion", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], BusquedaDocumentosDto.prototype, "punto", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], BusquedaDocumentosDto.prototype, "tipos", void 0);
__decorate([
    ApiPropertyOptional(),
    IsOptional(),
    ValidateNested(),
    Type(() => BusquedaParamsDto),
    __metadata("design:type", BusquedaParamsDto)
], BusquedaDocumentosDto.prototype, "params", void 0);
//# sourceMappingURL=dto.js.map