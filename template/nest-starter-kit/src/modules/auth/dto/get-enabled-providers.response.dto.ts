import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';

import { ListResponseDto } from '#/common/interfaces/response';

export class EnabledOAuthProviderItemDto {
  @ApiProperty({ description: 'OAuth 제공자 ID', example: 'google' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'OAuth 제공자 표시 명칭', example: 'Google' })
  @IsString()
  name!: string;

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

export class GetEnabledProvidersResponseDto extends ListResponseDto<EnabledOAuthProviderItemDto> {
  @ApiProperty({ type: [EnabledOAuthProviderItemDto], description: '활성화된 OAuth 제공자 목록' })
  @ValidateNested({ each: true })
  @Type(() => EnabledOAuthProviderItemDto)
  override items!: EnabledOAuthProviderItemDto[];

  @ApiProperty({ type: [String], description: 'OAuth 제공자 ID 목록' })
  @IsArray()
  providers!: string[];
}
