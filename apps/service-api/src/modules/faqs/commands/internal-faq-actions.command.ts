import type { CreateFaqRequestDto, UpdateFaqRequestDto } from '../dto';

export class CreateFaqCommand {
  constructor(public readonly input: CreateFaqRequestDto) {}
}

export class UpdateFaqCommand {
  constructor(public readonly input: { faqId: string, dto: UpdateFaqRequestDto }) {}
}

export class DeleteFaqCommand {
  constructor(public readonly faqId: string) {}
}
