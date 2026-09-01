import { Command } from '@nestjs/cqrs';

import type { RenderPreviewRequestDto, RenderPreviewResponseDto } from '#/modules/message-templates/dto';

export interface RenderTemplatePreviewPayload {
  id: string
  input: RenderPreviewRequestDto
}

export class RenderTemplatePreviewCommand extends Command<RenderPreviewResponseDto> {
  constructor(public readonly input: RenderTemplatePreviewPayload) {
    super();
  }
}
