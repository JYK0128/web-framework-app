import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { NotificationService } from '#/core/notification/notification.service';
import { AdminEmailConfigService } from '#/modules/system-configs/admin-email-config.service';
import { TestAdminEmailCommand } from '#/modules/system-configs/commands';
import { TestAdminEmailResponseDto } from '#/modules/system-configs/dto/admin-email/test-admin-email.response.dto';

@Injectable()
@CommandHandler(TestAdminEmailCommand)
export class TestAdminEmailHandler implements ICommandHandler<TestAdminEmailCommand, TestAdminEmailResponseDto> {
  constructor(private readonly systemConfig: AdminEmailConfigService, private readonly notifications: NotificationService) {}

  async execute(command: TestAdminEmailCommand): Promise<TestAdminEmailResponseDto> {
    await this.notifications.send({
      channel: 'email',
      message: {
        to: command.input.to,
        subject: '[Admin] SMTP 연결 테스트',
        text: 'Admin SMTP 릴레이 연결이 정상적으로 동작합니다.',
      },
      config: await this.systemConfig.getEmailDeliveryConfig(),
    });
    return TestAdminEmailResponseDto.fromPlain({ ok: true });
  }
}
