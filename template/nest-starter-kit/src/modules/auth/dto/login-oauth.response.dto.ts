import { ApiPropertyOptional } from '@nestjs/swagger';

import { UserProfileResponseDto } from './user-profile.response.dto';

export class LoginOAuthResponseDto {
  @ApiPropertyOptional({ type: () => UserProfileResponseDto })
  user?: UserProfileResponseDto;

  @ApiPropertyOptional()
  twoFactorRedirect?: boolean;

  @ApiPropertyOptional()
  termsRedirect?: boolean;
}
