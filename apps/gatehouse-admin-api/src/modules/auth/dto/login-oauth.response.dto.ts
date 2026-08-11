import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { UserProfileResponseDto } from './user-profile.response.dto';

export class LoginOAuthResponseDto {
  @ApiProperty({ type: () => UserProfileResponseDto })
  user!: UserProfileResponseDto;

  @ApiPropertyOptional()
  twoFactorRedirect?: boolean;
}
