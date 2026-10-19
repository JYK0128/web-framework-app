import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';

@ApiSchema({ name: 'OAuthLoginProviderDto' })
export class OAuthLoginProviderItemDto extends BaseDto {
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
