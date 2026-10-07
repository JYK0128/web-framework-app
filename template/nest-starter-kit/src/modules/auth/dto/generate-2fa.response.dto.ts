import { ApiProperty } from '@nestjs/swagger';

export class Generate2FAResponseDto {
  @ApiProperty({ type: 'string', description: 'Base32 encoded secret key' })
  secret!: string;
}
