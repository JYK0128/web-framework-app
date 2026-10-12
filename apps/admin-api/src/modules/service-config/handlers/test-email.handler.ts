import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { DeliveryConfigDto } from '@pkg/shared/server';

import { InternalClient } from '#/core/http/internal-client';
import { NotificationService } from '#/core/notification/notification.service';
import { TestEmailCommand } from '#/modules/service-config/commands/test-email.command';
import { TestEmailResponseDto } from '#/modules/service-config/dto/test-email.response.dto';

@Injectable()
@CommandHandler(TestEmailCommand)
export class TestEmailHandler implements ICommandHandler<TestEmailCommand, TestEmailResponseDto> {
  constructor(private readonly notifications: NotificationService, private readonly internalClient: InternalClient) {}

  async execute(command: TestEmailCommand): Promise<TestEmailResponseDto> {
    const delivery = await this.internalClient.fetch<DeliveryConfigDto>('/internal/system-configs/delivery-config-for-test', { method: 'POST', body: command.input.config ? { email: command.input.config } : {} });
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

    return TestEmailResponseDto.parse({ ok: true });
  }
}
