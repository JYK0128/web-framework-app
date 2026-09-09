import { Command } from '@nestjs/cqrs';

import type { MarkAllAlertsReadResponseDto } from '#/modules/alerts/dto';

export class MarkAllAlertsReadCommand extends Command<MarkAllAlertsReadResponseDto> {
  constructor() {
    super();
  }
}
