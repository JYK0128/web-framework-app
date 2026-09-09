import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';

import { Secret } from '#/common/decorators/secret.decorator';

export class OAuthProviderDetailDto {
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
  @Secret()
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

  @ApiPropertyOptional({ description: '토큰 폐기 endpoint URL' })
  @IsOptional()
  @IsString()
  revokeUrl?: string;

  @ApiPropertyOptional({ description: '요청할 OAuth Scope (기본값 오버라이드)', example: 'email profile' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ description: '프로바이더 아이콘 키', example: 'google' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: '프로바이더 브랜딩 컬러 (HEX)', example: '#4285F4' })
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  brandColor?: string;

  @ApiPropertyOptional({ description: '프로바이더 아이콘 업로드 URL' })
  @IsOptional()
  @IsString()
  iconUrl?: string;
}

export class OAuthConfigDto {
  @ApiPropertyOptional({ type: OAuthProviderDetailDto, description: 'Google OAuth 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OAuthProviderDetailDto)
  google?: OAuthProviderDetailDto;

  @ApiPropertyOptional({ type: OAuthProviderDetailDto, description: 'Kakao OAuth 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OAuthProviderDetailDto)
  kakao?: OAuthProviderDetailDto;

  @ApiPropertyOptional({ type: OAuthProviderDetailDto, description: 'Naver OAuth 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OAuthProviderDetailDto)
  naver?: OAuthProviderDetailDto;

  @ApiPropertyOptional({ type: OAuthProviderDetailDto, description: 'GitHub OAuth 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OAuthProviderDetailDto)
  github?: OAuthProviderDetailDto;

  @ApiPropertyOptional({ type: OAuthProviderDetailDto, description: 'Apple OAuth 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OAuthProviderDetailDto)
  apple?: OAuthProviderDetailDto;

  @ApiPropertyOptional({ type: OAuthProviderDetailDto, description: 'Microsoft OAuth 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OAuthProviderDetailDto)
  microsoft?: OAuthProviderDetailDto;

  @ApiPropertyOptional({ type: OAuthProviderDetailDto, description: 'Discord OAuth 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OAuthProviderDetailDto)
  discord?: OAuthProviderDetailDto;

  @ApiPropertyOptional({ type: OAuthProviderDetailDto, description: 'LINE OAuth 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OAuthProviderDetailDto)
  line?: OAuthProviderDetailDto;

  @ApiPropertyOptional({ type: OAuthProviderDetailDto, description: 'Facebook OAuth 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OAuthProviderDetailDto)
  facebook?: OAuthProviderDetailDto;

  @ApiPropertyOptional({ type: OAuthProviderDetailDto, description: 'Instagram OAuth 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OAuthProviderDetailDto)
  instagram?: OAuthProviderDetailDto;

  @ApiPropertyOptional({ type: OAuthProviderDetailDto, description: 'X (Twitter) OAuth 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OAuthProviderDetailDto)
  x?: OAuthProviderDetailDto;

  /** 동적/커스텀 OAuth 프로바이더 확장 지원 */
  [key: string]: OAuthProviderDetailDto | undefined;
}
