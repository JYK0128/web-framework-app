import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorVerifyChallengeResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
