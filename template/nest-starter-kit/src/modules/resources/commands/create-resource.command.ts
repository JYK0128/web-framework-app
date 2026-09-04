import type { CreateResourceRequestDto } from '#/modules/resources/dto';

export class CreateResourceCommand {
  constructor(public readonly input: CreateResourceRequestDto) {}
}
