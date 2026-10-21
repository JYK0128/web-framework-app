import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { IsBoolean, IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class OAuthProviderDetailDto extends BaseDto {
  @ApiProperty({ description: '프로바이더 활성화 여부', example: false, default: false })
  @IsBoolean()
  enabled: boolean = false;

  @ApiPropertyOptional({ description: '프로바이더 표시 명칭', example: 'Google' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'OAuth Client ID / App Key', example: 'your-client-id', default: '' })
  @IsString()
  clientId: string = '';

  @ApiProperty({ description: 'OAuth Client Secret / Secret Key', example: 'your-client-secret', default: '' })
  @IsString()
  clientSecret: string = '';

  @ApiPropertyOptional({ description: '인가 endpoint URL' })
  @IsOptional()
  @IsString()
  authorizeUrl?: string;

  @ApiPropertyOptional({ description: '토큰 endpoint URL' })
  @IsOptional()
  @IsString()
  tokenUrl?: string;

  @ApiPropertyOptional({ description: '사용자 정보 endpoint URL' })
  @IsOptional()
  @IsString()
  userInfoUrl?: string;

  @ApiPropertyOptional({ description: '사용자 정보 응답에서 고유 ID를 찾을 경로', example: 'sub' })
  @IsOptional()
  @IsString()
  userIdPath?: string;

  @ApiPropertyOptional({ description: '토큰 endpoint 클라이언트 인증 방식', enum: ['client_secret_post', 'client_secret_basic'], default: 'client_secret_post' })
  @IsOptional()
  @IsIn(['client_secret_post', 'client_secret_basic'])
  @IsString()
  tokenAuthMethod?: 'client_secret_post' | 'client_secret_basic';

  @ApiPropertyOptional({ description: 'UserInfo endpoint 대신 서명 검증된 OIDC ID Token 사용', default: false })
  @IsOptional()
  @IsBoolean()
  idTokenOnly?: boolean;

  @ApiPropertyOptional({ description: 'OIDC ID Token signature 검증용 JWKS URL' })
  @IsOptional()
  @IsString()
  jwksUrl?: string;

  @ApiPropertyOptional({ description: 'OIDC ID Token의 기대 issuer' })
  @IsOptional()
  @IsString()
  issuer?: string;

  @ApiPropertyOptional({ description: '사용자 정보 응답에서 이메일을 찾을 경로', example: 'email' })
  @IsOptional()
  @IsString()
  emailPath?: string;

  @ApiPropertyOptional({ description: '사용자 정보 응답에서 이름을 찾을 경로', example: 'name' })
  @IsOptional()
  @IsString()
  namePath?: string;

  @ApiPropertyOptional({ description: '검증된 이메일 여부 경로. true/yes/1/verified 값을 승인', example: 'email_verified' })
  @IsOptional()
  @IsString()
  emailVerifiedPath?: string;

  @ApiPropertyOptional({ description: '요청할 OAuth Scope (기본값 오버라이드)', example: 'email profile' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ description: '프로바이더 브랜딩 컬러 (HEX)', example: '#4285F4' })
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  brandColor?: string;

  @ApiPropertyOptional({ description: '프로바이더 브랜딩 텍스트 컬러 (HEX)', example: '#FFFFFF' })
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  brandTextColor?: string;

  @ApiPropertyOptional({ description: '프로바이더 아이콘 업로드 URL' })
  @IsOptional()
  @IsString()
  iconUrl?: string;
}
