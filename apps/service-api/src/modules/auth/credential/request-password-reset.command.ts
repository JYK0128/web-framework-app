import { Command } from '@nestjs/cqrs';

import type { RequestPasswordResetRequestDto } from '#/modules/auth/credential/request-password-reset.request.dto';
import type { RequestPasswordResetResponseDto } from '#/modules/auth/credential/request-password-reset.response.dto';

export class RequestPasswordResetCommand extends Command<RequestPasswordResetResponseDto> {
  constructor(public readonly input: RequestPasswordResetRequestDto) {
    super();
  }
}
