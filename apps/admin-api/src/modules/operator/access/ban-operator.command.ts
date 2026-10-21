import { Command } from '@nestjs/cqrs';

import type { BanOperatorRequestDto } from '~/modules/operator/access/ban-operator.request.dto';
import type { BanOperatorResponseDto } from '~/modules/operator/access/ban-operator.response.dto';

export class BanOperatorCommand extends Command<BanOperatorResponseDto> {
  constructor(public readonly input: { operatorId: string, data: BanOperatorRequestDto }) { super(); }
}
