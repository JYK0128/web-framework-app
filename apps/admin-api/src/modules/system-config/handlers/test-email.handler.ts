import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { NotificationService } from '#/infra/notification/notification.service';
import { TestEmailCommand } from '#/modules/system-config/commands/test-email.command';
import type { TestEmailResponseDto } from '#/modules/system-config/dto/test-email.dto';

@Injectable()
@CommandHandler(TestEmailCommand)
export class TestEmailHandler implements ICommandHandler<TestEmailCommand, TestEmailResponseDto> {
  constructor(private readonly notificationService: NotificationService) {}

  async execute(command: TestEmailCommand): Promise<TestEmailResponseDto> {
    const config = command.input.config;
    const result = await this.notificationService.sendEmail({
      from: config?.from ?? '',
      to: command.input.to,
      subject: '[시스템 설정] 이메일 발송 테스트',
      text: '이메일 발송 연동이 정상적으로 작동하고 있습니다.',
    }, config);

    return result.success
      ? { success: true, message: `${command.input.to} 주소로 테스트 이메일을 발송했습니다.` }
      : { success: false, message: `이메일 발송에 실패했습니다: ${result.error ?? '알 수 없는 오류'}` };
  }
}
