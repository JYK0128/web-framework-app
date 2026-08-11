import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorVerifyChallengeResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
