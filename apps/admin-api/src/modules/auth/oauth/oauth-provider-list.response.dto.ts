import { ApiProperty } from '@nestjs/swagger';

import { ListResponseDto } from '#/core/http/dto/response/list.response.dto';
import { OAuthLoginProviderItemDto } from '#/modules/auth/oauth/oauth-login-provider-item.dto';

export class OAuthProviderListResponseDto extends ListResponseDto<OAuthLoginProviderItemDto> {
  @ApiProperty({ type: [OAuthLoginProviderItemDto] })
  override items!: OAuthLoginProviderItemDto[];
}
