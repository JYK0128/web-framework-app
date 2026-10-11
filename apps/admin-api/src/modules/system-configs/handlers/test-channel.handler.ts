import { BadRequestException, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { NotificationService } from '#/core/notification';
import { TestMessengerCommand, TestPushCommand, TestSmsCommand } from '#/modules/system-configs/commands/test-channel.command';
import { TestChannelResponseDto } from '#/modules/system-configs/dto/delivery/test-channel.dto';
import { ServiceSystemConfigClient } from '#/modules/system-configs/service-system-config.client';

const result = (): TestChannelResponseDto => TestChannelResponseDto.fromPlain({ ok: true });

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

@Injectable()
@CommandHandler(TestMessengerCommand)
export class TestMessengerHandler implements ICommandHandler<TestMessengerCommand, TestChannelResponseDto> {
  constructor(private readonly notifications: NotificationService, private readonly systemConfigClient: ServiceSystemConfigClient) {}

  async execute(command: TestMessengerCommand): Promise<TestChannelResponseDto> {
    const config = await this.systemConfigClient.getDeliveryConfigForTest(command.input.config ? { messenger: command.input.config } : {});
    const { alimtalk, recipient } = command.input;
    if (config.messenger?.provider === 'KAKAO' && !alimtalk) throw new BadRequestException('알림톡 템플릿 코드와 본문이 필요합니다.');
    if (config.messenger?.provider !== 'KAKAO' && alimtalk) throw new BadRequestException('알림톡 입력은 카카오 대행사에서만 사용할 수 있습니다.');
    await this.notifications.send(alimtalk
      ? { channel: 'alimtalk', message: { ...alimtalk, recipient }, config: config.messenger }
      : { channel: 'messenger', message: { recipient, body: '[시스템 설정] 메신저 연동이 정상적으로 작동하고 있습니다.' }, config: config.messenger });
    return result();
  }
}
