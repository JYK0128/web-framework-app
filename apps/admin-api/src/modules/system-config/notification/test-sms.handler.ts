import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { NotificationService } from '@pkg/server-core/notification/notification.service';
import type { NotificationConfigDto } from '@pkg/shared/server';

import { InternalClient } from '#/core/internal-client';
import { TestSmsCommand } from '#/modules/system-config/notification/test-sms.command';
import { TestSmsResponseDto } from '#/modules/system-config/notification/test-sms.response.dto';

@Injectable()
@CommandHandler(TestSmsCommand)
export class TestSmsHandler implements ICommandHandler<TestSmsCommand, TestSmsResponseDto> {
  constructor(private readonly notifications: NotificationService, private readonly internalClient: InternalClient) {}

  async execute(command: TestSmsCommand): Promise<TestSmsResponseDto> {
    const config = await this.internalClient.fetch<NotificationConfigDto>('/internal/system-config/notification/config-for-test', { method: 'POST', body: command.input.config ? { sms: command.input.config } : {} });
    await this.notifications.send({ channel: 'sms', message: { to: command.input.to, body: '[시스템 설정] SMS 발송 연동이 정상적으로 작동하고 있습니다.' }, config: config.sms });
    return TestSmsResponseDto.ok();
  }
}
