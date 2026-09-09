import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'VerifyPasswordResetTokenResponse' })
export class VerifyPasswordResetTokenResponseDto {
  @ApiProperty({ type: 'boolean' })
  isValid!: boolean;

  @ApiPropertyOptional({ type: 'string', description: '마스킹된 사용자 이메일' })
  maskedEmail?: string;
}
