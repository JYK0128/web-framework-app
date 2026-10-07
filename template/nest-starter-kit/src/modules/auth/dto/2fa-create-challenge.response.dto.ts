import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorCreateChallengeResponseDto {
  @ApiProperty({ type: 'string' })
  challengeId!: string;

  @ApiProperty({ type: 'number' })
  expiresIn!: number;
}
