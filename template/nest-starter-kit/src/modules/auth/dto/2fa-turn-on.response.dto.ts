import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorTurnOnResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
