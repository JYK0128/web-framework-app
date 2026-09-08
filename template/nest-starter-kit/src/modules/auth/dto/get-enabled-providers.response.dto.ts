import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

import { ListResponseDto } from '#/common/interfaces/response';

export class EnabledOAuthProviderItemDto {
  @ApiProperty({ description: 'OAuth 제공자 ID', example: 'google' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'OAuth 제공자 표시 명칭', example: 'Google' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: '버튼 리소스 마크업 (SVG, HTML 등)' })
  @IsOptional()
  @IsString()
  resource?: string;
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
