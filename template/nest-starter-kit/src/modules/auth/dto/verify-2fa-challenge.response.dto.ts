import { ApiProperty } from '@nestjs/swagger';

export class Verify2FAChallengeResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
