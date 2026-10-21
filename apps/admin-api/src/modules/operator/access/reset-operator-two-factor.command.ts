import { Command } from '@nestjs/cqrs';

import type { ResetOperatorTwoFactorRequestDto } from '~/modules/operator/access/reset-operator-two-factor.request.dto';
import type { ResetOperatorTwoFactorResponseDto } from '~/modules/operator/access/reset-operator-two-factor.response.dto';

export class ResetOperatorTwoFactorCommand extends Command<ResetOperatorTwoFactorResponseDto> {
  constructor(public readonly input: ResetOperatorTwoFactorRequestDto) { super(); }
}
