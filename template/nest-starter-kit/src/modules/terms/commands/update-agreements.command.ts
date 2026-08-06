import { Command } from '@nestjs/cqrs';

import { UpdateAgreementsRequestDto } from '#/modules/terms/dto/update-agreements.request.dto';
import { UpdateAgreementsResponseDto } from '#/modules/terms/dto/update-agreements.response.dto';

export class UpdateAgreementsCommand extends Command<UpdateAgreementsResponseDto> {
  constructor(public readonly input: UpdateAgreementsRequestDto) { super(); }
}
