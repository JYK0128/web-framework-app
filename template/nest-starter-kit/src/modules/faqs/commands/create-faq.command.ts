import type { CreateFaqRequestDto } from '#/modules/faqs/dto';

export class CreateFaqCommand {
  constructor(public readonly input: CreateFaqRequestDto) {}
}
