import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorGenerateResponseDto {
  @ApiProperty({ description: 'QR Code Data URL' })
  url!: string;
}
