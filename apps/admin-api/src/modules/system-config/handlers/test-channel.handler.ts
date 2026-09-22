import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { NotificationService } from '#/infra/notification/notification.service';
import { TestMessengerCommand, TestPushCommand, TestSmsCommand } from '#/modules/system-config/commands/test-channel.command';
import type { MessengerConfigDto, PushConfigDto, SmsConfigDto } from '#/modules/system-config/dto/notification-config.dto';
import type { TestChannelResponseDto } from '#/modules/system-config/dto/test-channel.dto';
import { SystemConfigService } from '#/modules/system-config/system-config.service';

const result = (success: boolean, message: string): TestChannelResponseDto => ({ success, message });

@Injectable()
@CommandHandler(TestSmsCommand)
export class TestSmsHandler implements ICommandHandler<TestSmsCommand, TestChannelResponseDto> {
  constructor(private readonly notificationService: NotificationService, private readonly systemConfigService: SystemConfigService) {}

  async execute(command: TestSmsCommand): Promise<TestChannelResponseDto> {
    const saved = await this.systemConfigService.getValue('notification') as { sms?: SmsConfigDto } | undefined;
    const response = await this.notificationService.sendSms({ to: command.input.to, body: '[시스템 설정] SMS 발송 연동이 정상적으로 작동하고 있습니다.' }, command.input.config ?? saved?.sms);
    return result(response.success, response.success ? '테스트 SMS를 발송했습니다.' : `SMS 발송에 실패했습니다: ${response.error ?? '알 수 없는 오류'}`);
  }
}

@Injectable()
@CommandHandler(TestPushCommand)
export class TestPushHandler implements ICommandHandler<TestPushCommand, TestChannelResponseDto> {
  constructor(private readonly notificationService: NotificationService, private readonly systemConfigService: SystemConfigService) {}

  async execute(command: TestPushCommand): Promise<TestChannelResponseDto> {
    const saved = await this.systemConfigService.getValue('notification') as { push?: PushConfigDto } | undefined;
    const response = await this.notificationService.sendPush({ token: command.input.token, title: '시스템 설정 테스트', body: '푸시 알림 연동이 정상적으로 작동하고 있습니다.' }, command.input.config ?? saved?.push);
    return result(response.success, response.success ? '테스트 푸시를 발송했습니다.' : `푸시 발송에 실패했습니다: ${response.error ?? '알 수 없는 오류'}`);
  }
}

@Injectable()
@CommandHandler(TestMessengerCommand)
export class TestMessengerHandler implements ICommandHandler<TestMessengerCommand, TestChannelResponseDto> {
  constructor(private readonly notificationService: NotificationService, private readonly systemConfigService: SystemConfigService) {}

  async execute(command: TestMessengerCommand): Promise<TestChannelResponseDto> {
    const saved = await this.systemConfigService.getValue('notification') as { messenger?: MessengerConfigDto } | undefined;
    const response = await this.notificationService.sendMessenger({ recipient: command.input.recipient, body: '[시스템 설정] 메신저 연동이 정상적으로 작동하고 있습니다.' }, command.input.config ?? saved?.messenger);
    return result(response.success, response.success ? '테스트 메신저 알림을 발송했습니다.' : `메신저 발송에 실패했습니다: ${response.error ?? '알 수 없는 오류'}`);
  }
}
