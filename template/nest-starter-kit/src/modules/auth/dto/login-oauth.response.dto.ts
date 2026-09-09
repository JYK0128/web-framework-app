import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginOAuthResponseDto {
  @ApiPropertyOptional({ type: 'string' })
  challengeId?: string;

  @ApiProperty({ type: 'number', example: 600, description: '2FA 챌린지 유효시간(초)' })
  expiresIn?: number;

  @ApiPropertyOptional({ type: 'boolean' })
  ok?: boolean;
}
