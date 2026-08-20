import { ApiPropertyOptional } from '@nestjs/swagger';

export class LoginOAuthResponseDto {
  @ApiPropertyOptional({ type: 'string' })
  challengeId?: string;

  @ApiPropertyOptional({ type: 'boolean' })
  ok?: boolean;
}
