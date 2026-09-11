import { Command } from '@nestjs/cqrs';

import type { MarkAllAlertsReadResponseDto } from '#/modules/alerts/dto';
import type { MarkAllAlertsReadRequestDto } from '#/modules/alerts/dto';

export class MarkAllAlertsReadCommand extends Command<MarkAllAlertsReadResponseDto> {
  constructor(public readonly input: MarkAllAlertsReadRequestDto) {
    super();
  }
}
