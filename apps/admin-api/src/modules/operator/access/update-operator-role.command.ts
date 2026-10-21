import { Command } from '@nestjs/cqrs';

import type { UpdateOperatorRoleRequestDto } from '~/modules/operator/access/update-operator-role.request.dto';
import type { UpdateOperatorRoleResponseDto } from '~/modules/operator/access/update-operator-role.response.dto';

export class UpdateOperatorRoleCommand extends Command<UpdateOperatorRoleResponseDto> {
  constructor(public readonly input: { operatorId: string, data: UpdateOperatorRoleRequestDto }) { super(); }
}
