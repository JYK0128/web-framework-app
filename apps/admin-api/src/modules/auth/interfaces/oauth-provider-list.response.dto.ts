import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ListResponseDto } from '#/common/interfaces/response';

export class OAuthLoginProviderDto {
  @ApiProperty({ example: 'google' })
  id!: string;

  @ApiProperty({ example: 'Google' })
  name!: string;

  @ApiPropertyOptional({ example: '/oauth-icons/google.png' })
  iconUrl?: string;

  @ApiPropertyOptional({ example: '#ffffff' })
  brandColor?: string;

  @ApiPropertyOptional({ example: '#202124' })
  brandTextColor?: string;
}

export class OAuthProviderListResponseDto extends ListResponseDto<OAuthLoginProviderDto> {
  @ApiProperty({ type: [OAuthLoginProviderDto] })
  override items!: OAuthLoginProviderDto[];
}
