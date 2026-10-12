import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { DeliveryConfigDto } from '@pkg/shared/server';

import { InternalClient } from '#/core/http/internal-client';
import { NotificationService } from '#/core/notification/notification.service';
import { TestChannelResponseDto } from '#/modules/system-config/delivery/test-channel.response.dto';
import { TestSmsCommand } from '#/modules/system-config/delivery/test-sms.command';

@Injectable()
@CommandHandler(TestSmsCommand)
export class TestSmsHandler implements ICommandHandler<TestSmsCommand, TestChannelResponseDto> {
  constructor(private readonly notifications: NotificationService, private readonly internalClient: InternalClient) {}

  async execute(command: TestSmsCommand): Promise<TestChannelResponseDto> {
    const config = await this.internalClient.fetch<DeliveryConfigDto>('/internal/system-configs/delivery-config-for-test', { method: 'POST', body: command.input.config ? { sms: command.input.config } : {} });
    await this.notifications.send({ channel: 'sms', message: { to: command.input.to, body: '[시스템 설정] SMS 발송 연동이 정상적으로 작동하고 있습니다.' }, config: config.sms });
    return TestChannelResponseDto.parse({ ok: true });
  }
}
