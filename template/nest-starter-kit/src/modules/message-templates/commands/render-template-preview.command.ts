import { Command } from '@nestjs/cqrs';

import type { RenderTemplatePreviewRequestDto, RenderTemplatePreviewResponseDto } from '#/modules/message-templates/dto';

export interface RenderTemplatePreviewPayload {
  messageTemplateId: string
  input: RenderTemplatePreviewRequestDto
}

export class RenderTemplatePreviewCommand extends Command<RenderTemplatePreviewResponseDto> {
  constructor(public readonly input: RenderTemplatePreviewPayload) {
    super();
  }
}
