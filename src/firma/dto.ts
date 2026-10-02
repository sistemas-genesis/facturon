import { IsString } from 'class-validator';

export class FirmaInfoDto {
  /** Archivo .p12 como data URL: "data:application/x-pkcs12;base64,<datos>" */
  @IsString() firma!: string;
  @IsString() pass!: string;
}
