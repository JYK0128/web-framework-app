import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Verify2FAChallengeResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiPropertyOptional()
  termsRedirect?: boolean;
}
