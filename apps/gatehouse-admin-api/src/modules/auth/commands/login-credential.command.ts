import { Command } from '@nestjs/cqrs';

import type { LoginCredentialRequestDto } from '#/modules/auth/dto/login-credential.request.dto';
import type { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

export class LoginCredentialCommand extends Command<UserProfileResponseDto> {
  constructor(public readonly input: LoginCredentialRequestDto) { super(); }
}
