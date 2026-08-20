import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorVerifyChallengeResponseDto {
  @ApiProperty()
  ok!: boolean;
}
