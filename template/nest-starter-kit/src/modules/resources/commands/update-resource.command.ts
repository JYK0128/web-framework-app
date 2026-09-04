import type { UpdateResourceRequestDto } from '#/modules/resources/dto/update-resource.dto';

export class UpdateResourceCommand {
  constructor(public readonly input: { id: string, input: UpdateResourceRequestDto }) {}
}
