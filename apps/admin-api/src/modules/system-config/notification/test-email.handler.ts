import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { NotificationConfigDto } from '@pkg/server-core/notification/dto';
import { NotificationService } from '@pkg/server-core/notification/notification.service';

import { InternalClient } from '#/core/internal-client';
import { TestEmailCommand } from '#/modules/system-config/notification/test-email.command';
import { TestEmailResponseDto } from '#/modules/system-config/notification/test-email.response.dto';

@Injectable()
@CommandHandler(TestEmailCommand)
export class TestEmailHandler implements ICommandHandler<TestEmailCommand, TestEmailResponseDto> {
  constructor(private readonly notifications: NotificationService, private readonly internalClient: InternalClient) {}

  async execute(command: TestEmailCommand): Promise<TestEmailResponseDto> {
    const notification = await this.internalClient.fetch<NotificationConfigDto>('/internal/system-config/notification/config-for-test', { method: 'POST', body: command.input.config ? { email: command.input.config } : {} });
    const config = notification.email;
    await this.notifications.send({
      channel: 'email',
      message: {
        to: command.input.to,
        subject: '[시스템 설정] 이메일 발송 테스트',
        text: '이메일 발송 연동이 정상적으로 작동하고 있습니다.',
      },
      config,
    });

    return TestEmailResponseDto.ok();
  }
}
