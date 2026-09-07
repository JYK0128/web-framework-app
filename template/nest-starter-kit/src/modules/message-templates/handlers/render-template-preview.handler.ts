import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { MESSAGE_TEMPLATE_CATALOG } from '#/common/constants/message-template-catalog.constant';
import { MessageTemplate } from '#/entities/templates/message-template.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { TemplateRendererService } from '#/infra/notification';
import { RenderTemplatePreviewCommand } from '#/modules/message-templates/commands';
import type { RenderPreviewRequestDto, RenderPreviewResponseDto } from '#/modules/message-templates/dto';

@Injectable()
@CommandHandler(RenderTemplatePreviewCommand)
export class RenderTemplatePreviewHandler implements ICommandHandler<RenderTemplatePreviewCommand, RenderPreviewResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly templateRenderer: TemplateRendererService,
  ) {}

  async execute(command: RenderTemplatePreviewCommand): Promise<RenderPreviewResponseDto> {
    const template = await this.identifyTemplate(command.input.id);
    return this.process(template, command.input.input);
  }

  private async identifyTemplate(id: string): Promise<MessageTemplate> {
    const template = await this.em.findOne(
      MessageTemplate,
      { id },
      { populate: ['channels'], filters: false },
    );
    if (!template) {
      throw new ApplicationError({
        code: 'TEMPLATE_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: '메시지 템플릿을 찾을 수 없습니다.',
      });
    }
    return template;
  }

  private process(template: MessageTemplate, input: RenderPreviewRequestDto): RenderPreviewResponseDto {
    const channels = template.channels.getItems().sort((a, b) => a.priority - b.priority);
    const targetChannel = input.channel
      ? channels.find((c) => c.channel === input.channel)
      : channels.find((c) => c.isActive) ?? channels[0];

    if (!targetChannel) {
      throw new ApplicationError({
        code: 'CHANNEL_TEMPLATE_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: '해당 템플릿에 등록된 채널 템플릿이 없습니다.',
      });
    }

    const catalogItem = MESSAGE_TEMPLATE_CATALOG.find((c) => c.code === template.code);
    const catalogSampleVars: Record<string, unknown> = {};
    if (catalogItem) {
      for (const v of catalogItem.variables) {
        catalogSampleVars[v.key] = v.sampleValue;
      }
    }

    const mockVariables: Record<string, unknown> = {
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
      ...catalogSampleVars,
      ...(input.variables ?? {}),
    };

    const finalVariables = this.templateRenderer.buildVariables(mockVariables);

    const title = targetChannel.title ? this.templateRenderer.interpolate(targetChannel.title, finalVariables) : null;
    const body = this.templateRenderer.interpolate(targetChannel.body, finalVariables);

    return {
      title,
      body,
      channel: targetChannel.channel,
    };
  }
}
