import { BadGatewayException, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { SmtpAdapter } from '#/infra/notification/channels/email/smtp.adapter';
import { TestEmailCommand } from '#/modules/system-configs/commands/test-email.command';
import { TestEmailResponseDto } from '#/modules/system-configs/dto/delivery/test-email.dto';
import { ServiceSystemConfigClient } from '#/modules/system-configs/service-system-config.client';

@Injectable()
@CommandHandler(TestEmailCommand)
export class TestEmailHandler implements ICommandHandler<TestEmailCommand, TestEmailResponseDto> {
  constructor(private readonly smtpAdapter: SmtpAdapter, private readonly systemConfigClient: ServiceSystemConfigClient) {}

  async execute(command: TestEmailCommand): Promise<TestEmailResponseDto> {
    const delivery = await this.systemConfigClient.getDeliveryConfigForTest(command.input.config ? { email: command.input.config } : {});
    const config = delivery.email;
    const result = await this.smtpAdapter.send({
      from: config?.from ?? '',
      to: command.input.to,
      subject: '[시스템 설정] 이메일 발송 테스트',
      text: '이메일 발송 연동이 정상적으로 작동하고 있습니다.',
    }, config);

    if (!result.success) throw new BadGatewayException(result.error ?? '테스트 이메일 발송에 실패했습니다.');

    return TestEmailResponseDto.fromPlain({ ok: true });
  }
}
