import { Command } from '@nestjs/cqrs';

import { CreateSupportMessageRequestDto } from '~/modules/support/message/create-support-message.request.dto';
import { CreateSupportMessageResponseDto } from '~/modules/support/message/create-support-message.response.dto';

export class CreateOwnSupportMessageCommand extends Command<CreateSupportMessageResponseDto> {
  constructor(public readonly input: { roomId: string, dto: CreateSupportMessageRequestDto }) { super(); }
}
