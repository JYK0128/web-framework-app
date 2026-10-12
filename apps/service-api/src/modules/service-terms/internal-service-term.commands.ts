import { Command } from '@nestjs/cqrs';

import { type CreateInternalServiceTermRequestDto, type DeleteInternalServiceTermResponseDto, type InternalServiceTermItemDto } from '#/modules/service-terms';
import type { UpdateInternalServiceTermRequestDto } from '#/modules/service-terms/update-internal-service-term.request.dto';

export class CreateInternalServiceTermCommand extends Command<InternalServiceTermItemDto> {
  constructor(public readonly input: CreateInternalServiceTermRequestDto) { super(); }
}

export class UpdateInternalServiceTermCommand extends Command<InternalServiceTermItemDto> {
  constructor(public readonly input: { termId: string, dto: UpdateInternalServiceTermRequestDto }) { super(); }
}

export class DeleteInternalServiceTermCommand extends Command<DeleteInternalServiceTermResponseDto> {
  constructor(public readonly input: { termId: string }) { super(); }
}

export class PublishInternalServiceTermCommand extends Command<InternalServiceTermItemDto> {
  constructor(public readonly input: { termId: string }) { super(); }
}
