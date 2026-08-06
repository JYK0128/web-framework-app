import { ApiProperty } from '@nestjs/swagger';

export class Generate2FAResponseDto {
  @ApiProperty({ description: 'QR Code Data URL' })
  url!: string;
}
