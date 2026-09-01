import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorTurnOffResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
