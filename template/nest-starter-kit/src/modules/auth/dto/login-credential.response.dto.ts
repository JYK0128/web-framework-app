import { ApiPropertyOptional } from '@nestjs/swagger';

export class LoginCredentialResponseDto {
  @ApiPropertyOptional()
  challengeId?: string;

  @ApiPropertyOptional()
  ok?: boolean;
}
