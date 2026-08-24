import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { MessageTemplate } from '#/entities/templates/message-template.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { TemplateRendererService } from '#/infra/notification';
import { RenderTemplatePreviewCommand } from '#/modules/message-templates/commands';
import type { RenderPreviewResponseDto } from '#/modules/message-templates/dto';

@Injectable()
@CommandHandler(RenderTemplatePreviewCommand)
export class RenderTemplatePreviewHandler implements ICommandHandler<RenderTemplatePreviewCommand, RenderPreviewResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly templateRenderer: TemplateRendererService,
  ) {}

  async execute(command: RenderTemplatePreviewCommand): Promise<RenderPreviewResponseDto> {
    const template = await this.identifyTemplate(command.input.id);
    return this.process(template, command.input.input.variables ?? {});
  }

  private async identifyTemplate(id: string): Promise<MessageTemplate> {
    const template = await this.em.findOne(MessageTemplate, { id }, { filters: false });
    if (!template) {
      throw new ApplicationError({
        code: 'TEMPLATE_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: '메시지 템플릿을 찾을 수 없습니다.',
      });
    }
    return template;
  }

  private process(template: MessageTemplate, sampleVars: Record<string, unknown>): RenderPreviewResponseDto {
    const mockVariables: Record<string, unknown> = {
      appName: 'Antigravity App',
      userName: '홍길동',
      author: '홍길동',
      title: '회원 탈퇴 및 정보 변경 건',
      category: '계정/인증',
      assignee: '김상담',
      minutes: 10,
      elapsedMinutes: 15,
      code: '829314',
      targetLink: 'https://example.com/verify?code=829314',
      linkUrl: 'https://example.com/inquiries/01JGXYZ',
      inquiryId: '01JGXYZABC12345',
      id: '01JGXYZABC12345',
      ...sampleVars,
    };

    const title = template.title ? this.templateRenderer.interpolate(template.title, mockVariables) : null;
    const body = this.templateRenderer.interpolate(template.body, mockVariables);

    return {
      title,
      body,
      channel: template.channel,
      locale: template.locale,
    };
  }
}
