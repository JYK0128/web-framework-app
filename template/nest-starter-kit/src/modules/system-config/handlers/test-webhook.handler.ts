import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AlertService } from '#/infra/alert';
import { TestWebhookCommand } from '#/modules/system-config/commands/test-webhook.command';
import { TestWebhookResponseDto } from '#/modules/system-config/dto';

@Injectable()
@CommandHandler(TestWebhookCommand)
export class TestWebhookHandler implements ICommandHandler<TestWebhookCommand, TestWebhookResponseDto> {
  constructor(private readonly alertService: AlertService) {}

  async execute(command: TestWebhookCommand): Promise<TestWebhookResponseDto> {
    const input = this.identify(command);
    this.verify(input);
    return this.process(input);
  }

  private identify(command: TestWebhookCommand) {
    return command.input;
  }

  private verify(input: TestWebhookCommand['input']): void {
    if (!input.webhookUrl || !input.webhookUrl.trim().startsWith('http')) {
      throw new Error('올바른 웹훅 URL 형식이 아닙니다.');
    }
  }

  private async process(input: TestWebhookCommand['input']): Promise<TestWebhookResponseDto> {
    const res = await this.alertService.send({
      webhookUrl: input.webhookUrl,
      title: '🔔 [시스템 테스트 알림]',
      text: '웹훅 알림 연동이 성공적으로 확인되었습니다. 1:1 문의 알림이 정상 수신됩니다.',
      sections: [
        { label: '알림 채널', value: input.type },
        {
          label: '발송 시각 (KST)',
          value: new Intl.DateTimeFormat('ko-KR', {
            timeZone: 'Asia/Seoul',
            dateStyle: 'medium',
            timeStyle: 'medium',
          }).format(new Date()),
        },
        { label: '상태', value: '정상 작동' },
      ],
    });

    return {
      success: res.success,
      message: res.success
        ? '테스트 알림이 성공적으로 전송되었습니다.'
        : '웹훅 알림 전송에 실패했습니다. Webhook URL 및 채널 상태를 확인해주세요.',
    };
  }
}
