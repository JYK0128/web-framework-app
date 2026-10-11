import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { NotificationService } from '#/core/notification/notification.service';
import { TestSmsCommand } from '#/modules/system-configs/commands/test-sms.command';
import { TestChannelResponseDto } from '#/modules/system-configs/dto/delivery/test-channel.response.dto';
import { result } from '#/modules/system-configs/handlers/test-channel.helpers';
import { ServiceSystemConfigClient } from '#/modules/system-configs/service-system-config.client';

@Injectable()
@CommandHandler(TestSmsCommand)
export class TestSmsHandler implements ICommandHandler<TestSmsCommand, TestChannelResponseDto> {
  constructor(private readonly notifications: NotificationService, private readonly systemConfigClient: ServiceSystemConfigClient) {}

  async execute(command: TestSmsCommand): Promise<TestChannelResponseDto> {
    const config = await this.systemConfigClient.getDeliveryConfigForTest(command.input.config ? { sms: command.input.config } : {});
    await this.notifications.send({ channel: 'sms', message: { to: command.input.to, body: '[시스템 설정] SMS 발송 연동이 정상적으로 작동하고 있습니다.' }, config: config.sms });
    return result();
  }
}
