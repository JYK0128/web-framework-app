import { ApiPropertyOptional } from '@nestjs/swagger';

export class LoginOAuthResponseDto {
  @ApiPropertyOptional()
  challengeId?: string;

  @ApiPropertyOptional()
  accessToken?: string;

  @ApiPropertyOptional()
  refreshToken?: string;

  @ApiPropertyOptional({ example: 'Bearer' })
  tokenType?: 'Bearer';
}
