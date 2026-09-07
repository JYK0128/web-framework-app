import { ApiPropertyOptional } from '@nestjs/swagger';

export class LoginCredentialResponseDto {
  @ApiPropertyOptional({ type: 'string' })
  challengeId?: string;

  @ApiPropertyOptional({ type: 'number', example: 600 })
  expiresIn?: number;

  @ApiPropertyOptional({ type: 'boolean' })
  ok?: boolean;
}
