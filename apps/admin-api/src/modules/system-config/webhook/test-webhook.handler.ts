import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { WebhookService } from '@pkg/server-core/webhook/webhook.service';

import { TestWebhookCommand } from '#/modules/system-config/webhook/test-webhook.command';
import { TestWebhookResponseDto } from '#/modules/system-config/webhook/test-webhook.response.dto';

@Injectable()
@CommandHandler(TestWebhookCommand)
export class TestWebhookHandler implements ICommandHandler<TestWebhookCommand, TestWebhookResponseDto> {
  constructor(private readonly webhooks: WebhookService) {}

  async execute(command: TestWebhookCommand): Promise<TestWebhookResponseDto> {
    const { webhookUrl, type } = command.input;
    await this.webhooks.send({
      type,
      title: '시스템 테스트 알림',
      text: `${type} 웹훅 연동이 정상적으로 확인되었습니다.`,
      webhookUrl,
    });
    return TestWebhookResponseDto.ok();
  }
}
