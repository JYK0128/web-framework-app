import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorGenerateResponseDto {
  @ApiProperty({ type: 'string' })
  url!: string;
}
