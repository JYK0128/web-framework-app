import { Command } from '@nestjs/cqrs';

import { InternalServiceTermGroupItemDto, InternalServiceTermGroupRequestDto } from '#/modules/service-terms/dto';

export class CreateInternalServiceTermGroupCommand extends Command<InternalServiceTermGroupItemDto> {
  constructor(public readonly input: InternalServiceTermGroupRequestDto) { super(); }
}
export class UpdateInternalServiceTermGroupCommand extends Command<InternalServiceTermGroupItemDto> {
  constructor(public readonly input: { groupId: string, dto: InternalServiceTermGroupRequestDto }) { super(); }
}
export class DeleteInternalServiceTermGroupCommand extends Command<{ success: boolean }> {
  constructor(public readonly groupId: string) { super(); }
}
