import { ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { OAuthProviderDetailDto } from '#/modules/system-config/dto/oauth-provider-detail.dto';

export class OAuthConfigDto {
  static parse(plain: unknown): OAuthConfigDto {
    return plainToInstance(OAuthConfigDto, plain ?? {});
  }

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
