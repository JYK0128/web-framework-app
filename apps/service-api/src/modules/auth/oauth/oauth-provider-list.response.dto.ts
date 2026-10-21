import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response';

import { OAuthLoginProviderItemDto } from '~/modules/auth/oauth/oauth-login-provider-item.dto';

export class OAuthProviderListResponseDto extends ListResponseDto<OAuthLoginProviderItemDto> {
  @ApiProperty({ type: [OAuthLoginProviderItemDto] })
  override items!: OAuthLoginProviderItemDto[];
}
