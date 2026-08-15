import type { UpdateFaqRequestDto } from '#/modules/faqs/dto';

export class UpdateFaqCommand {
  constructor(
    public readonly id: string,
    public readonly input: UpdateFaqRequestDto,
  ) {}
}
