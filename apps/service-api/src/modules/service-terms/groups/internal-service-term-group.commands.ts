import { Command } from '@nestjs/cqrs';

import { CreateInternalServiceTermGroupRequestDto, DeleteInternalServiceTermGroupResponseDto, InternalServiceTermGroupItemDto } from '#/modules/service-terms';
import type { UpdateInternalServiceTermGroupRequestDto } from '#/modules/service-terms/groups/update-internal-service-term-group.request.dto';

export class CreateInternalServiceTermGroupCommand extends Command<InternalServiceTermGroupItemDto> {
  constructor(public readonly input: CreateInternalServiceTermGroupRequestDto) { super(); }
}
export class UpdateInternalServiceTermGroupCommand extends Command<InternalServiceTermGroupItemDto> {
  constructor(public readonly input: { groupId: string, dto: UpdateInternalServiceTermGroupRequestDto }) { super(); }
}
export class DeleteInternalServiceTermGroupCommand extends Command<DeleteInternalServiceTermGroupResponseDto> {
  constructor(public readonly input: { groupId: string }) { super(); }
}
