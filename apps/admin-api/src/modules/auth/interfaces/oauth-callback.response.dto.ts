import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base/base.dto';

@ApiSchema({ name: 'OAuthCallbackResponse' })
export class OAuthCallbackResponseDto extends BaseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ description: '로그인 후 이동할 같은 출처의 경로' })
  returnTo!: string;
}
