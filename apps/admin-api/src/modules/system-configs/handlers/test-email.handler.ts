import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { NotificationService } from '#/core/notification/notification.service';
import { TestEmailCommand } from '#/modules/system-configs/commands/test-email.command';
import { TestEmailResponseDto } from '#/modules/system-configs/dto/delivery/test-email.dto';
import { ServiceSystemConfigClient } from '#/modules/system-configs/service-system-config.client';

@Injectable()
@CommandHandler(TestEmailCommand)
export class TestEmailHandler implements ICommandHandler<TestEmailCommand, TestEmailResponseDto> {
  constructor(private readonly notifications: NotificationService, private readonly systemConfigClient: ServiceSystemConfigClient) {}

  async execute(command: TestEmailCommand): Promise<TestEmailResponseDto> {
    const delivery = await this.systemConfigClient.getDeliveryConfigForTest(command.input.config ? { email: command.input.config } : {});
    const config = delivery.email;
    await this.notifications.send({
      channel: 'email',
      message: {
        to: command.input.to,
        subject: '[시스템 설정] 이메일 발송 테스트',
        text: '이메일 발송 연동이 정상적으로 작동하고 있습니다.',
      },
      config,
    });

    return TestEmailResponseDto.fromPlain({ ok: true });
  }
}
