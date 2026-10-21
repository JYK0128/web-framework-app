import { Command } from '@nestjs/cqrs';

import type { RestoreOperatorRequestDto } from '~/modules/operator/account/restore-operator.request.dto';
import type { RestoreOperatorResponseDto } from '~/modules/operator/account/restore-operator.response.dto';

export class RestoreOperatorCommand extends Command<RestoreOperatorResponseDto> {
  constructor(public readonly input: RestoreOperatorRequestDto) { super(); }
}
