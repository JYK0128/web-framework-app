import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { MESSAGE_TEMPLATE_CATALOG } from '#/common/constants/message-template-catalog.constant';
import { SessionContext } from '#/common/contexts/session.context';
import { Alert, AlertType } from '#/entities/alerts/alert.entity';
import { User } from '#/entities/auth/user.entity';
import { MessageChannel, MessageTemplate } from '#/entities/templates/message-template.entity';
import { AlertService } from '#/infra/alert';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { NotificationService, TemplateRendererService } from '#/infra/notification';
import { AlertsGateway } from '#/modules/alerts/alerts.gateway';
import { AlertItemDto } from '#/modules/alerts/dto/alert-item.dto';
import { TestSendTemplateCommand } from '#/modules/message-templates/commands';
import type { TestSendTemplateRequestDto, TestSendTemplateResponseDto } from '#/modules/message-templates/dto';

@Injectable()
@CommandHandler(TestSendTemplateCommand)
export class TestSendTemplateHandler implements ICommandHandler<TestSendTemplateCommand, TestSendTemplateResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly templateRenderer: TemplateRendererService,
    private readonly notification: NotificationService,
    private readonly alertService: AlertService,
    private readonly alertsGateway: AlertsGateway,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(command: TestSendTemplateCommand): Promise<TestSendTemplateResponseDto> {
    const template = await this.identifyTemplate(command.input.id);
    const adminUser = await this.identifyAdmin(this.sessionContext.requiredUser.id);
    this.verify(template, adminUser, command.input.input);
    return this.process(template, adminUser, command.input.input);
  }

  private verify(
    template: MessageTemplate,
    adminUser: User,
    input: TestSendTemplateRequestDto,
  ): void {
    if (!template || !adminUser || !input) {
      throw new ApplicationError({
        code: 'TEMPLATE_TEST_SEND_INPUT_INVALID',
        status: HttpStatus.BAD_REQUEST,
        message: '템플릿 테스트 발송 입력을 확인할 수 없습니다.',
      });
    }
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

  private async identifyAdmin(userId: string): Promise<User> {
    const user = await this.em.findOne(User, { id: userId }, { filters: false });
    if (!user) {
      throw new ApplicationError({
        code: 'USER_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: '관리자 계정을 찾을 수 없습니다.',
      });
    }
    return user;
  }

  private async process(
    template: MessageTemplate,
    adminUser: User,
    input: TestSendTemplateRequestDto,
  ): Promise<TestSendTemplateResponseDto> {
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
      userName: adminUser.name || '관리자',
      author: adminUser.name || '관리자',
      title: '[테스트] 문의 및 알림 제목',
      category: '테스트카테고리',
      assignee: adminUser.name || '담당자',
      minutes: 10,
      elapsedMinutes: 10,
      code: '123456',
      targetLink: 'https://example.com/test-verify',
      linkUrl: '/dashboard',
      inquiryId: '01JGTESTINQUIRY',
      id: '01JGTESTID',
      ...catalogSampleVars,
      ...input.variables,
    };

    const rendered = await this.templateRenderer.render(template.code, mockVariables, {
      channel: targetChannel.channel,
    });

    if (targetChannel.channel === MessageChannel.EMAIL) {
      const recipientEmail = input.recipientEmail || adminUser.email;
      if (!recipientEmail) {
        throw new ApplicationError({
          code: 'RECIPIENT_REQUIRED',
          status: HttpStatus.BAD_REQUEST,
          message: '테스트 이메일을 수신할 주소를 입력해 주세요.',
        });
      }

      await this.notification.sendEmail({
        to: recipientEmail,
        subject: `[테스트 발송] ${rendered.title || template.name}`,
        html: rendered.body,
        text: rendered.body.replace(/<[^>]*>?/gm, ''),
      });

      return {
        success: true,
        message: `${recipientEmail} 주소로 테스트 이메일이 발송되었습니다.`,
      };
    }

    if (targetChannel.channel === MessageChannel.IN_APP) {
      const alert = this.em.create(Alert, {
        user: adminUser,
        type: AlertType.NOTICE,
        title: `[테스트] ${rendered.title || template.name}`,
        content: rendered.body,
        linkUrl: '/dashboard',
        isRead: false,
      });
      this.em.persist(alert);
      await this.em.flush();
      await this.alertsGateway.broadcastAlert(new AlertItemDto(alert));

      return {
        success: true,
        message: '관리자 계정으로 테스트 인앱 알림이 전송되었습니다.',
      };
    }

    if (targetChannel.channel === MessageChannel.SLACK) {
      await this.alertService.sendText(
        `[테스트 발송 - ${template.name}]\n${rendered.body}`,
      );

      return {
        success: true,
        message: '슬랙 웹훅 채널로 테스트 메시지가 전송되었습니다.',
      };
    }

    return {
      success: true,
      message: `${targetChannel.channel} 채널 테스트 렌더링이 완료되었습니다.`,
    };
  }
}
