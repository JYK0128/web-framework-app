import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'IssuePasswordResetChallengeResponse' })
export class IssuePasswordResetChallengeResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;

  @ApiProperty({ type: 'integer', description: '토큰 유효 시간(초)' })
  expiresIn!: number;

  @ApiPropertyOptional({ type: 'string', description: '로컬 개발 테스트용 매직 링크' })
  devMagicLink?: string;

  @ApiPropertyOptional({ type: 'boolean', description: '소셜 로그인 전용 계정 여부' })
  isOAuthUser?: boolean;

  @ApiPropertyOptional({ type: 'string', description: '소셜 로그인 제공자' })
  oauthProvider?: string;
}
