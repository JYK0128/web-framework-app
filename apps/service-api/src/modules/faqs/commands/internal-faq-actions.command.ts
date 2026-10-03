import { Command } from '@nestjs/cqrs';

import { type CreateFaqRequestDto, type FaqActionResponseDto, type FaqItemDto, type UpdateFaqRequestDto } from '#/modules/faqs/dto';

export class CreateFaqCommand extends Command<FaqItemDto> {
  constructor(public readonly input: CreateFaqRequestDto) { super(); }
}

export class UpdateFaqCommand extends Command<FaqItemDto> {
  constructor(public readonly input: { faqId: string, dto: UpdateFaqRequestDto }) { super(); }
}

export class DeleteFaqCommand extends Command<FaqActionResponseDto> {
  constructor(public readonly input: { faqId: string }) { super(); }
}
