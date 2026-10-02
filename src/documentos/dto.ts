import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

class BusquedaParamsDto {
  /** true = filtra por fecha de autorizacion; si no, por fecha de comprobante. */
  @IsOptional()
  fecha_autorizacion?: boolean;
}

/**
 * Body de POST /api/documento/... y /api/documentoLike/...
 * (listas separadas por coma tal como las arma el front: ",1790000000001," etc.)
 */
export class BusquedaDocumentosDto {
  @IsString() empresas!: string;
  @IsString() estacion!: string;
  @IsString() punto!: string;
  @IsString() tipos!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => BusquedaParamsDto)
  params?: BusquedaParamsDto;
}
