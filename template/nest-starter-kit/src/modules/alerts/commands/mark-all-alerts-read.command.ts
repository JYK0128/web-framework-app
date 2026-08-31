import { Command } from '@nestjs/cqrs';

import type { MarkAllAlertsReadResponseDto } from '#/modules/alerts/dto';

export interface MarkAllAlertsReadPayload {
  userId: string
}

export class MarkAllAlertsReadCommand extends Command<MarkAllAlertsReadResponseDto> {
  constructor(public readonly input: MarkAllAlertsReadPayload) {
    super();
  }
}
