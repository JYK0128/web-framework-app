import { Command } from '@nestjs/cqrs';

import type { PublishInternalServiceTermRequestDto } from '~/modules/service-term/document/publish-internal-service-term.request.dto';
import { PublishInternalServiceTermResponseDto } from '~/modules/service-term/document/publish-internal-service-term.response.dto';

export class PublishInternalServiceTermCommand extends Command<PublishInternalServiceTermResponseDto> {
  constructor(public readonly input: PublishInternalServiceTermRequestDto) {
    super();
  }
}
