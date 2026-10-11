import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { NotificationService } from '#/core/notification/notification.service';
import { TestPushCommand } from '#/modules/system-configs/commands/test-push.command';
import { TestChannelResponseDto } from '#/modules/system-configs/dto/delivery/test-channel.response.dto';
import { result } from '#/modules/system-configs/handlers/test-channel.helpers';
import { ServiceSystemConfigClient } from '#/modules/system-configs/service-system-config.client';

@Injectable()
@CommandHandler(TestPushCommand)
export class TestPushHandler implements ICommandHandler<TestPushCommand, TestChannelResponseDto> {
  constructor(private readonly notifications: NotificationService, private readonly systemConfigClient: ServiceSystemConfigClient) {}

  async execute(command: TestPushCommand): Promise<TestChannelResponseDto> {
    const config = await this.systemConfigClient.getDeliveryConfigForTest(command.input.config ? { push: command.input.config } : {});
    await this.notifications.send({ channel: 'push', message: { token: command.input.token, title: '시스템 설정 테스트', body: '푸시 알림 연동이 정상적으로 작동하고 있습니다.' }, config: config.push });
    return result();
  }
}
