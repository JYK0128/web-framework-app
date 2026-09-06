import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

import { Secret } from '#/common/decorators/secret.decorator';

export class OAuthProviderDetailDto {
  @ApiProperty({ description: '프로바이더 활성화 여부', example: false, default: false })
  @IsBoolean()
  enabled: boolean = false;

  @ApiProperty({ description: 'OAuth Client ID / App Key', example: 'your-client-id', default: '' })
  @IsString()
  clientId: string = '';

  @ApiProperty({ description: 'OAuth Client Secret / Secret Key', example: 'your-client-secret', default: '' })
  @IsString()
  @Secret()
  clientSecret: string = '';

  @ApiPropertyOptional({ description: '요청할 OAuth Scope (기본값 오버라이드)', example: 'email profile' })
  @IsOptional()
  @IsString()
  scope?: string;
}

export class OAuthConfigDto {
  @ApiPropertyOptional({ type: OAuthProviderDetailDto, description: 'Google OAuth 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OAuthProviderDetailDto)
  google?: OAuthProviderDetailDto = new OAuthProviderDetailDto();

  @ApiPropertyOptional({ type: OAuthProviderDetailDto, description: 'Kakao OAuth 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OAuthProviderDetailDto)
  kakao?: OAuthProviderDetailDto = new OAuthProviderDetailDto();

  @ApiPropertyOptional({ type: OAuthProviderDetailDto, description: 'Naver OAuth 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OAuthProviderDetailDto)
  naver?: OAuthProviderDetailDto = new OAuthProviderDetailDto();

  @ApiPropertyOptional({ type: OAuthProviderDetailDto, description: 'GitHub OAuth 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OAuthProviderDetailDto)
  github?: OAuthProviderDetailDto = new OAuthProviderDetailDto();
}
