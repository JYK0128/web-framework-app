import { Command } from '@nestjs/cqrs';

import { UserUnregisterRequestDto } from '#/modules/auth/dto/user-unregister.request.dto';
import { UserUnregisterResponseDto } from '#/modules/auth/dto/user-unregister.response.dto';

export class UserUnregisterCommand extends Command<UserUnregisterResponseDto> {
  constructor(public readonly input: UserUnregisterRequestDto) { super(); }
}
