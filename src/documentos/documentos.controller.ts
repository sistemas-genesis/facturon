import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../tenants/current-tenant.decorator.js';
import { TenantGuard } from '../tenants/tenant.guard.js';
import type { Tenant } from '../tenants/tenant.types.js';
import { BusquedaDocumentosDto } from './dto.js';
import { DocumentosService } from './documentos.service.js';

/** Consulta de comprobantes en la BD de la empresa indicada por :db (rutas del servicio original). */
@ApiTags('Documentos')
@Controller('api')
@UseGuards(TenantGuard)
export class DocumentosController {
  constructor(private readonly documentos: DocumentosService) {}

  @Post('documento/:cedula_ruc&:start&:end&:db')
  @HttpCode(200)
  get(
    @CurrentTenant() tenant: Tenant,
    @Param('cedula_ruc') cedulaRuc: string,
    @Param('start') start: string,
    @Param('end') end: string,
    @Body() body: BusquedaDocumentosDto,
  ) {
    return this.documentos.buscarPorComprador(
      tenant,
      cedulaRuc,
      start,
      end,
      body,
    );
  }

  @Post('documentoLike/:start&:end&:db')
  @HttpCode(200)
  getLike(
    @CurrentTenant() tenant: Tenant,
    @Param('start') start: string,
    @Param('end') end: string,
    @Body() body: BusquedaDocumentosDto,
  ) {
    return this.documentos.buscarTodos(tenant, start, end, body);
  }

  @Get('getXmlById/:db/:id')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  getXmlById(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.documentos.xmlPorId(tenant, id);
  }
}
