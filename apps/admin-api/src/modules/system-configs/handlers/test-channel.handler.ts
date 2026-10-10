import { BadGatewayException, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { MessengerAdapter } from '#/infra/notification/channels/messenger/messenger.adapter';
import { PushAdapter } from '#/infra/notification/channels/push/push.adapter';
import { SmsAdapter } from '#/infra/notification/channels/sms/sms.adapter';
import { TestMessengerCommand, TestPushCommand, TestSmsCommand } from '#/modules/system-configs/commands/test-channel.command';
import { TestChannelResponseDto } from '#/modules/system-configs/dto/delivery/test-channel.dto';
import { ServiceSystemConfigClient } from '#/modules/system-configs/service-system-config.client';

const result = (success: boolean, error: string | undefined): TestChannelResponseDto => {
  if (!success) throw new BadGatewayException(error ?? '테스트 발송에 실패했습니다.');

  return TestChannelResponseDto.fromPlain({ ok: true });
};

@Injectable()
@CommandHandler(TestSmsCommand)
export class TestSmsHandler implements ICommandHandler<TestSmsCommand, TestChannelResponseDto> {
  constructor(private readonly smsAdapter: SmsAdapter, private readonly systemConfigClient: ServiceSystemConfigClient) {}

  async execute(command: TestSmsCommand): Promise<TestChannelResponseDto> {
    const config = await this.systemConfigClient.getDeliveryConfigForTest(command.input.config ? { sms: command.input.config } : {});
    const response = await this.smsAdapter.send({ to: command.input.to, body: '[시스템 설정] SMS 발송 연동이 정상적으로 작동하고 있습니다.' }, config.sms);
    return result(response.success, response.error);
  }
}

@Injectable()
@CommandHandler(TestPushCommand)
export class TestPushHandler implements ICommandHandler<TestPushCommand, TestChannelResponseDto> {
  constructor(private readonly pushAdapter: PushAdapter, private readonly systemConfigClient: ServiceSystemConfigClient) {}

  async execute(command: TestPushCommand): Promise<TestChannelResponseDto> {
    const config = await this.systemConfigClient.getDeliveryConfigForTest(command.input.config ? { push: command.input.config } : {});
    const response = await this.pushAdapter.send({ token: command.input.token, title: '시스템 설정 테스트', body: '푸시 알림 연동이 정상적으로 작동하고 있습니다.' }, config.push);
    return result(response.success, response.error);
  }
}

@Injectable()
@CommandHandler(TestMessengerCommand)
export class TestMessengerHandler implements ICommandHandler<TestMessengerCommand, TestChannelResponseDto> {
  constructor(private readonly messengerAdapter: MessengerAdapter, private readonly systemConfigClient: ServiceSystemConfigClient) {}

  async execute(command: TestMessengerCommand): Promise<TestChannelResponseDto> {
    const config = await this.systemConfigClient.getDeliveryConfigForTest(command.input.config ? { messenger: command.input.config } : {});
    const response = await this.messengerAdapter.send({ recipient: command.input.recipient, body: '[시스템 설정] 메신저 연동이 정상적으로 작동하고 있습니다.' }, config.messenger);
    return result(response.success, response.error);
  }
}
