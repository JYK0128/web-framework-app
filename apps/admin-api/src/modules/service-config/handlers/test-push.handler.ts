import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { DeliveryConfigDto } from '@pkg/shared/server';

import { InternalClient } from '#/core/http/internal-client';
import { NotificationService } from '#/core/notification/notification.service';
import { TestPushCommand } from '#/modules/service-config/commands/test-push.command';
import { TestChannelResponseDto } from '#/modules/service-config/dto/test-channel.response.dto';
import { result } from '#/modules/service-config/handlers/test-channel.helpers';

@Injectable()
@CommandHandler(TestPushCommand)
export class TestPushHandler implements ICommandHandler<TestPushCommand, TestChannelResponseDto> {
  constructor(private readonly notifications: NotificationService, private readonly internalClient: InternalClient) {}

  async execute(command: TestPushCommand): Promise<TestChannelResponseDto> {
    const config = await this.internalClient.fetch<DeliveryConfigDto>('/internal/system-configs/delivery-config-for-test', { method: 'POST', body: command.input.config ? { push: command.input.config } : {} });
    await this.notifications.send({ channel: 'push', message: { token: command.input.token, title: '시스템 설정 테스트', body: '푸시 알림 연동이 정상적으로 작동하고 있습니다.' }, config: config.push });
    return result();
  }
}
