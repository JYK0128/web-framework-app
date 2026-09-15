import { Command } from '@nestjs/cqrs';

import type { CreateAlertRequestDto, CreateAlertResponseDto } from '#/modules/alerts/dto';

export class CreateAlertCommand extends Command<CreateAlertResponseDto> {
  constructor(public readonly input: CreateAlertRequestDto) {
    super();
  }
}
