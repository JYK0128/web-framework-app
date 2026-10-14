import { Command } from '@nestjs/cqrs';

import type { UpdateOperatorRoleRequestDto } from '#/modules/operators/access/update-operator-role.request.dto';
import type { UpdateOperatorRoleResponseDto } from '#/modules/operators/access/update-operator-role.response.dto';

export class UpdateOperatorRoleCommand extends Command<UpdateOperatorRoleResponseDto> {
  constructor(public readonly input: { operatorId: string, data: UpdateOperatorRoleRequestDto }) { super(); }
}
