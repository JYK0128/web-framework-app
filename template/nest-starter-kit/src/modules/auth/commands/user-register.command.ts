import { Command } from '@nestjs/cqrs';

import type { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';
import type { UserRegisterRequestDto } from '#/modules/auth/dto/user-register.request.dto';

export class UserRegisterCommand extends Command<UserProfileResponseDto> {
  constructor(public readonly input: UserRegisterRequestDto) { super(); }
}
