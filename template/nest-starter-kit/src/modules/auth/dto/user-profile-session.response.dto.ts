import { ApiProperty } from '@nestjs/swagger';

import { UserProfileResponseDto } from './user-profile.response.dto';

export class UserProfileSessionResponseDto {
  @ApiProperty({ type: () => UserProfileResponseDto })
  user!: UserProfileResponseDto;

  @ApiProperty({ example: '2026-08-06T19:24:00.000Z', nullable: true })
  expiresAt!: string | null;
}
