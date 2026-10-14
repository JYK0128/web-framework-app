import { Command } from '@nestjs/cqrs';

import { CreateSupportMessageRequestDto } from '#/modules/support/messages/create-support-message.request.dto';
import { CreateSupportMessageResponseDto } from '#/modules/support/messages/create-support-message.response.dto';

export class CreateOwnSupportMessageCommand extends Command<CreateSupportMessageResponseDto> {
  constructor(public readonly input: { roomId: string, dto: CreateSupportMessageRequestDto }) { super(); }
}
