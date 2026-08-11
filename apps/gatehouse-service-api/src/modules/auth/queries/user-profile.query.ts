import { Query } from '@nestjs/cqrs';

import { UserProfileRequestDto } from '#/modules/auth/dto/user-profile.request.dto';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

export class UserProfileQuery extends Query<UserProfileResponseDto> {
  constructor(public readonly input: UserProfileRequestDto) { super(); }
}
