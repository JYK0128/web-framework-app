import { ApiPropertyOptional } from '@nestjs/swagger';

export class LoginCredentialResponseDto {
  @ApiPropertyOptional({ type: 'string' })
  challengeId?: string;

  @ApiPropertyOptional({ type: 'boolean' })
  ok?: boolean;
}
