import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorCreateChallengeResponseDto {
  @ApiProperty()
  token!: string;
}
