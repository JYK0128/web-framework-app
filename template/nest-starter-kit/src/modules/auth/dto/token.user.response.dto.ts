import { ApiProperty } from '@nestjs/swagger';

import { UserProfileResponseDto } from './user-profile.response.dto';

export class ImpersonationTokenResponseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty({ type: () => UserProfileResponseDto })
  user!: UserProfileResponseDto;

  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: 'Bearer';
}
