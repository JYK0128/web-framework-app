import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorGenerateResponseDto {
  @ApiProperty({ type: 'string', description: 'Base32 encoded secret key' })
  secret!: string;
}
