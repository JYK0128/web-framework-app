import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { MessengerAdapter } from '#/infra/delivery/channels/messenger/messenger.adapter';
import { PushAdapter } from '#/infra/delivery/channels/push/push.adapter';
import { SmsAdapter } from '#/infra/delivery/channels/sms/sms.adapter';
import { TestMessengerCommand, TestPushCommand, TestSmsCommand } from '#/modules/system-configs/commands/test-channel.command';
import type { TestChannelResponseDto } from '#/modules/system-configs/dto/delivery/test-channel.dto';

const result = (success: boolean, message: string): TestChannelResponseDto => ({ success, message });

@Injectable()
@CommandHandler(TestSmsCommand)
export class TestSmsHandler implements ICommandHandler<TestSmsCommand, TestChannelResponseDto> {
  constructor(private readonly smsAdapter: SmsAdapter) {}

  async execute(command: TestSmsCommand): Promise<TestChannelResponseDto> {
    const response = await this.smsAdapter.send({ to: command.input.to, body: '[시스템 설정] SMS 발송 연동이 정상적으로 작동하고 있습니다.' }, command.input.config);
    return result(response.success, response.success ? '테스트 SMS를 발송했습니다.' : `SMS 발송에 실패했습니다: ${response.error ?? '알 수 없는 오류'}`);
  }
}

@Injectable()
@CommandHandler(TestPushCommand)
export class TestPushHandler implements ICommandHandler<TestPushCommand, TestChannelResponseDto> {
  constructor(private readonly pushAdapter: PushAdapter) {}

  async execute(command: TestPushCommand): Promise<TestChannelResponseDto> {
    const response = await this.pushAdapter.send({ token: command.input.token, title: '시스템 설정 테스트', body: '푸시 알림 연동이 정상적으로 작동하고 있습니다.' }, command.input.config);
    return result(response.success, response.success ? '테스트 푸시를 발송했습니다.' : `푸시 발송에 실패했습니다: ${response.error ?? '알 수 없는 오류'}`);
  }
}

@Injectable()
@CommandHandler(TestMessengerCommand)
export class TestMessengerHandler implements ICommandHandler<TestMessengerCommand, TestChannelResponseDto> {
  constructor(private readonly messengerAdapter: MessengerAdapter) {}

  async execute(command: TestMessengerCommand): Promise<TestChannelResponseDto> {
    const response = await this.messengerAdapter.send({ recipient: command.input.recipient, body: '[시스템 설정] 메신저 연동이 정상적으로 작동하고 있습니다.' }, command.input.config);
    return result(response.success, response.success ? '테스트 메신저 알림을 발송했습니다.' : `메신저 발송에 실패했습니다: ${response.error ?? '알 수 없는 오류'}`);
  }
}
