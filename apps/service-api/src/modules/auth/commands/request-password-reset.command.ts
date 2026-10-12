import { Command } from '@nestjs/cqrs';

import type { RequestPasswordResetRequestDto, RequestPasswordResetResponseDto } from '#/modules/auth/dto';

export class RequestPasswordResetCommand extends Command<RequestPasswordResetResponseDto> {
  constructor(public readonly input: RequestPasswordResetRequestDto) { super(); }
}
