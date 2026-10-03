import { Command } from '@nestjs/cqrs';

import type { InternalServiceTermRequestDto } from '#/modules/service-terms/dto';
import type { DeleteInternalServiceTermResponseDto, InternalServiceTermItemDto } from '#/modules/service-terms/dto';

export class CreateInternalServiceTermCommand extends Command<InternalServiceTermItemDto> { constructor(public readonly input: InternalServiceTermRequestDto) { super(); } }
export class UpdateInternalServiceTermCommand extends Command<InternalServiceTermItemDto> { constructor(public readonly input: { termId: string, dto: InternalServiceTermRequestDto }) { super(); } }
export class DeleteInternalServiceTermCommand extends Command<DeleteInternalServiceTermResponseDto> { constructor(public readonly input: { termId: string }) { super(); } }
export class PublishInternalServiceTermCommand extends Command<InternalServiceTermItemDto> { constructor(public readonly input: { termId: string }) { super(); } }
