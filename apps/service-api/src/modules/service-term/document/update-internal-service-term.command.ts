import { Command } from '@nestjs/cqrs';

import type { UpdateInternalServiceTermRequestDto } from '~/modules/service-term/document/update-internal-service-term.request.dto';
import { UpdateInternalServiceTermResponseDto } from '~/modules/service-term/document/update-internal-service-term.response.dto';

export class UpdateInternalServiceTermCommand extends Command<UpdateInternalServiceTermResponseDto> {
  constructor(public readonly input: { termId: string, dto: UpdateInternalServiceTermRequestDto }) {
    super();
  }
}
