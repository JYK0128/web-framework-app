import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { HttpWebhookAdapter } from '#/infra/delivery/channels/webhook/webhook.adapter';
import { TestWebhookCommand } from '#/modules/system-configs/commands/test-webhook.command';
import type { TestWebhookResponseDto } from '#/modules/system-configs/dto/webhook/test-webhook.dto';

@Injectable()
@CommandHandler(TestWebhookCommand)
export class TestWebhookHandler implements ICommandHandler<TestWebhookCommand, TestWebhookResponseDto> {
  constructor(private readonly webhookAdapter: HttpWebhookAdapter) {}

  async execute(command: TestWebhookCommand): Promise<TestWebhookResponseDto> {
    const { webhookUrl, type } = command.input;
    const payload = type === 'DISCORD'
      ? { content: `[시스템 테스트 알림] ${type} 웹훅 연동이 정상적으로 확인되었습니다.` }
      : { text: `[시스템 테스트 알림] ${type} 웹훅 연동이 정상적으로 확인되었습니다.`, title: '시스템 테스트 알림', status: 'ok' };

    const result = await this.webhookAdapter.send({ url: webhookUrl, type, payload });
    return result.success
      ? { success: true, message: '테스트 웹훅이 성공적으로 전송되었습니다.' }
      : { success: false, message: `웹훅 전송에 실패했습니다: ${result.error ?? '대상 서비스 상태를 확인해주세요.'}` };
  }
}
