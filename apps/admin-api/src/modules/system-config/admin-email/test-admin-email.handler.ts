import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { NotificationService } from '@pkg/server-core/notification';

import { GetAdminSmtpConfigQuery } from '~/modules/system-config/admin-email/get-admin-smtp-config.query';
import { TestAdminEmailCommand } from '~/modules/system-config/admin-email/test-admin-email.command';
import { TestAdminEmailResponseDto } from '~/modules/system-config/admin-email/test-admin-email.response.dto';

@Injectable()
@CommandHandler(TestAdminEmailCommand)
export class TestAdminEmailHandler implements ICommandHandler<TestAdminEmailCommand, TestAdminEmailResponseDto> {
  constructor(private readonly queryBus: QueryBus, private readonly notifications: NotificationService) {}

  async execute(command: TestAdminEmailCommand): Promise<TestAdminEmailResponseDto> {
    await this.notifications.send({
      channel: 'email',
      message: {
        to: command.input.to,
        subject: '[Admin] SMTP 연결 테스트',
        text: 'Admin SMTP 릴레이 연결이 정상적으로 동작합니다.',
      },
      config: await this.queryBus.execute(new GetAdminSmtpConfigQuery()),
    });
    return TestAdminEmailResponseDto.ok();
  }
}
