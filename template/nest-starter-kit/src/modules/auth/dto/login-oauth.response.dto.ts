import { ApiPropertyOptional } from '@nestjs/swagger';

export class LoginOAuthResponseDto {
  @ApiPropertyOptional()
  challengeId?: string;

  @ApiPropertyOptional()
  ok?: boolean;
}
