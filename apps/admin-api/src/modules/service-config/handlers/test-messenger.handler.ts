import { BadRequestException, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { DeliveryConfigDto } from '@pkg/shared/server';

import { InternalClient } from '#/core/http/internal-client';
import { NotificationService } from '#/core/notification/notification.service';
import { TestMessengerCommand } from '#/modules/service-config/commands/test-messenger.command';
import { TestChannelResponseDto } from '#/modules/service-config/dto/test-channel.response.dto';
import { result } from '#/modules/service-config/handlers/test-channel.helpers';

@Injectable()
@CommandHandler(TestMessengerCommand)
export class TestMessengerHandler implements ICommandHandler<TestMessengerCommand, TestChannelResponseDto> {
  constructor(private readonly notifications: NotificationService, private readonly internalClient: InternalClient) {}

  async execute(command: TestMessengerCommand): Promise<TestChannelResponseDto> {
    const config = await this.internalClient.fetch<DeliveryConfigDto>('/internal/system-configs/delivery-config-for-test', { method: 'POST', body: command.input.config ? { messenger: command.input.config } : {} });
    const { alimtalk, recipient } = command.input;
    if (config.messenger?.provider === 'KAKAO' && !alimtalk) throw new BadRequestException('알림톡 템플릿 코드와 본문이 필요합니다.');
    if (config.messenger?.provider !== 'KAKAO' && alimtalk) throw new BadRequestException('알림톡 입력은 카카오 대행사에서만 사용할 수 있습니다.');
    await this.notifications.send(alimtalk
      ? { channel: 'alimtalk', message: { ...alimtalk, recipient }, config: config.messenger }
      : { channel: 'messenger', message: { recipient, body: '[시스템 설정] 메신저 연동이 정상적으로 작동하고 있습니다.' }, config: config.messenger });
    return result();
  }
}
