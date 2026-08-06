import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginCredentialResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiPropertyOptional()
  twoFactorRedirect?: boolean;

  @ApiPropertyOptional()
  termsRedirect?: boolean;
}
