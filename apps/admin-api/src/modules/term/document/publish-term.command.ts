import { Command } from '@nestjs/cqrs';

import type { PublishTermRequestDto } from '~/modules/term/document/publish-term.request.dto';
import type { PublishTermResponseDto } from '~/modules/term/document/publish-term.response.dto';

export class PublishTermCommand extends Command<PublishTermResponseDto> {
  constructor(public readonly input: PublishTermRequestDto) {
    super();
  }
}
