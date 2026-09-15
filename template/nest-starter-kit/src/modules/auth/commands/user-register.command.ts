import { Command } from '@nestjs/cqrs';

import type { UserRegisterRequestDto } from '#/modules/auth/dto/user-register.request.dto';
import type { UserRegisterResponseDto } from '#/modules/auth/dto/user-register.response.dto';

export class UserRegisterCommand extends Command<UserRegisterResponseDto> {
  constructor(public readonly input: UserRegisterRequestDto) { super(); }
}
