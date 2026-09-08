import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { NotificationService } from '#/infra/notification';
import { TestMessengerCommand, TestPushCommand, TestSmsCommand } from '#/modules/system-config/commands/test-channel.command';
import type { TestMessengerResponseDto, TestPushResponseDto, TestSmsResponseDto } from '#/modules/system-config/dto';

@Injectable()
@CommandHandler(TestSmsCommand)
export class TestSmsHandler implements ICommandHandler<TestSmsCommand, TestSmsResponseDto> {
  constructor(private readonly notificationService: NotificationService) {}

  async execute(command: TestSmsCommand): Promise<TestSmsResponseDto> {
    const input = command.input;
    if (!input.to || input.to.trim().length === 0) {
      throw new Error('유효한 수신 휴대폰 번호를 입력해주세요.');
    }

    try {
      const result = await this.notificationService.sendSms(
        {
          to: input.to.trim(),
          body: '[시스템 설정] SMS 발송 연동이 정상적으로 작동하고 있습니다.',
        },
        input.config,
      );

      return {
        success: result.success,
        message: result.success
          ? `${input.to} 번호로 테스트 SMS가 성공적으로 발송되었습니다. (ID: ${result.messageId ?? 'ok'})`
          : (result.error || 'SMS 발송 제공자 연동에 실패했습니다. 설정을 확인해주세요.'),
      };
    }
    catch (error) {
      const errMsg = error instanceof Error ? error.message : '알 수 없는 오류';
      return {
        success: false,
        message: `SMS 발송에 실패했습니다: ${errMsg}`,
      };
    }
  }
}

@Injectable()
@CommandHandler(TestPushCommand)
export class TestPushHandler implements ICommandHandler<TestPushCommand, TestPushResponseDto> {
  constructor(private readonly notificationService: NotificationService) {}

  async execute(command: TestPushCommand): Promise<TestPushResponseDto> {
    const input = command.input;
    if (!input.token || input.token.trim().length === 0) {
      throw new Error('유효한 푸시 디바이스 토큰을 입력해주세요.');
    }

    try {
      const success = await this.notificationService.sendPush({
        token: input.token.trim(),
        title: '🔔 [시스템 설정] 푸시 알림 테스트',
        body: '푸시 알림 연동이 정상적으로 작동하고 있습니다.',
      });

      return {
        success,
        message: success
          ? '테스트 푸시 알림이 성공적으로 전송되었습니다.'
          : '푸시 발송 제공자 연동에 실패했습니다. 설정을 확인해주세요.',
      };
    }
    catch (error) {
      const errMsg = error instanceof Error ? error.message : '알 수 없는 오류';
      return {
        success: false,
        message: `푸시 알림 발송에 실패했습니다: ${errMsg}`,
      };
    }
  }
}

@Injectable()
@CommandHandler(TestMessengerCommand)
export class TestMessengerHandler implements ICommandHandler<TestMessengerCommand, TestMessengerResponseDto> {
  constructor(private readonly notificationService: NotificationService) {}

  async execute(command: TestMessengerCommand): Promise<TestMessengerResponseDto> {
    const input = command.input;
    if (!input.recipient || input.recipient.trim().length === 0) {
      throw new Error('유효한 메신저 수신 대상을 입력해주세요.');
    }

    try {
      if (!input.config) throw new Error('메신저 설정이 필요합니다.');
      const result = input.config.provider === 'KAKAO'
        ? await this.notificationService.sendKakao(
          { recipientPhone: input.recipient.trim(), title: '비즈니스 메신저 테스트', message: '[시스템 설정] 비즈니스 메신저 연동이 정상적으로 작동하고 있습니다.' },
          input.config.kakao,
        )
        : await this.notificationService.sendMessenger(
          input.recipient.trim(),
          '[시스템 설정] 비즈니스 메신저 연동이 정상적으로 작동하고 있습니다.',
          input.config,
        );

      return {
        success: result.success,
        message: result.success
          ? `${input.recipient} 대상으로 테스트 메신저 알림이 발송되었습니다. (ID: ${result.messageId ?? 'ok'})`
          : (result.error || '메신저 발송 제공자 연동에 실패했습니다. 설정을 확인해주세요.'),
      };
    }
    catch (error) {
      const errMsg = error instanceof Error ? error.message : '알 수 없는 오류';
      return {
        success: false,
        message: `메신저 알림 발송에 실패했습니다: ${errMsg}`,
      };
    }
  }
}
