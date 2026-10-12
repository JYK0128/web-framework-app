import { Command } from '@nestjs/cqrs';

import type { PublishTermRequestDto } from '#/modules/terms/documents/publish-term.request.dto';
import type { PublishTermResponseDto } from '#/modules/terms/documents/publish-term.response.dto';

export class PublishTermCommand extends Command<PublishTermResponseDto> {
  constructor(public readonly input: PublishTermRequestDto) {
    super();
  }
}
