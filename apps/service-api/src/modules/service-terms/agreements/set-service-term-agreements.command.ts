import { Command } from '@nestjs/cqrs';

import type { SetServiceTermAgreementsRequestDto } from '#/modules/service-terms/agreements/set-service-term-agreements.request.dto';
import { SetServiceTermAgreementsResponseDto } from '#/modules/service-terms/agreements/set-service-term-agreements.response.dto';

export class SetServiceTermAgreementsCommand extends Command<SetServiceTermAgreementsResponseDto> {
  constructor(public readonly input: { userId: string, dto: SetServiceTermAgreementsRequestDto }) {
    super();
  }
}
