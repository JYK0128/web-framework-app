import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { NotificationService } from '@pkg/server-core/notification/notification.service';
import type { NotificationConfigDto } from '@pkg/shared/server';

import { InternalClient } from '#/core/internal-client';
import { TestPushCommand } from '#/modules/system-config/notification/test-push.command';
import { TestPushResponseDto } from '#/modules/system-config/notification/test-push.response.dto';

@Injectable()
@CommandHandler(TestPushCommand)
export class TestPushHandler implements ICommandHandler<TestPushCommand, TestPushResponseDto> {
  constructor(private readonly notifications: NotificationService, private readonly internalClient: InternalClient) {}

  async execute(command: TestPushCommand): Promise<TestPushResponseDto> {
    const config = await this.internalClient.fetch<NotificationConfigDto>('/internal/system-config/notification/config-for-test', { method: 'POST', body: command.input.config ? { push: command.input.config } : {} });
    await this.notifications.send({ channel: 'push', message: { token: command.input.token, title: '시스템 설정 테스트', body: '푸시 알림 연동이 정상적으로 작동하고 있습니다.' }, config: config.push });
    return TestPushResponseDto.parse({ ok: true });
  }
}
