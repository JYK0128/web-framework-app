import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyEmailResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: true })
  emailVerified!: boolean;

  @ApiPropertyOptional()
  accessToken?: string;

  @ApiPropertyOptional()
  refreshToken?: string;

  @ApiPropertyOptional({ example: 'Bearer' })
  tokenType?: 'Bearer';
}
