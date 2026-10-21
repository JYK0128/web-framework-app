import { Command } from '@nestjs/cqrs';

import type { UpdateInternalServiceTermGroupRequestDto } from '~/modules/service-term/group/update-internal-service-term-group.request.dto';
import { UpdateInternalServiceTermGroupResponseDto } from '~/modules/service-term/group/update-internal-service-term-group.response.dto';

export class UpdateInternalServiceTermGroupCommand extends Command<UpdateInternalServiceTermGroupResponseDto> {
  constructor(public readonly input: { groupId: string, dto: UpdateInternalServiceTermGroupRequestDto }) {
    super();
  }
}
