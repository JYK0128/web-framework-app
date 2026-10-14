import { BadRequestException, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { NotificationService } from '@pkg/server-core/notification/notification.service';
import type { NotificationConfigDto } from '@pkg/shared/server';

import { InternalClient } from '#/core/internal-client';
import { TestMessengerCommand } from '#/modules/system-config/notification/test-messenger.command';
import { TestMessengerResponseDto } from '#/modules/system-config/notification/test-messenger.response.dto';

@Injectable()
@CommandHandler(TestMessengerCommand)
export class TestMessengerHandler implements ICommandHandler<TestMessengerCommand, TestMessengerResponseDto> {
  constructor(private readonly notifications: NotificationService, private readonly internalClient: InternalClient) {}

  async execute(command: TestMessengerCommand): Promise<TestMessengerResponseDto> {
    const config = await this.internalClient.fetch<NotificationConfigDto>('/internal/system-config/notification/config-for-test', { method: 'POST', body: command.input.config ? { messenger: command.input.config } : {} });
    const { alimtalk, recipient } = command.input;
    if (config.messenger?.provider === 'KAKAO' && !alimtalk) throw new BadRequestException('알림톡 템플릿 코드와 본문이 필요합니다.');
    if (config.messenger?.provider !== 'KAKAO' && alimtalk) throw new BadRequestException('알림톡 입력은 카카오 대행사에서만 사용할 수 있습니다.');
    await this.notifications.send(alimtalk
      ? { channel: 'alimtalk', message: { ...alimtalk, recipient }, config: config.messenger }
      : { channel: 'messenger', message: { recipient, body: '[시스템 설정] 메신저 연동이 정상적으로 작동하고 있습니다.' }, config: config.messenger });
    return TestMessengerResponseDto.parse({ ok: true });
  }
}
