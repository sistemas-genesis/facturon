import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RideXmlDto {
  @ApiProperty({ description: 'XML del comprobante (ce_xml)' })
  @IsString()
  @MinLength(1)
  xml!: string;
}
