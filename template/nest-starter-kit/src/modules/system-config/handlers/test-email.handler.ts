import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { NotificationService } from '#/infra/notification';
import { TestEmailCommand } from '#/modules/system-config/commands/test-email.command';
import { TestEmailResponseDto } from '#/modules/system-config/dto';

@Injectable()
@CommandHandler(TestEmailCommand)
export class TestEmailHandler implements ICommandHandler<TestEmailCommand, TestEmailResponseDto> {
  constructor(private readonly notificationService: NotificationService) {}

  async execute(command: TestEmailCommand): Promise<TestEmailResponseDto> {
    const input = this.identify(command);
    this.verify(input);
    return this.process(input);
  }

  private identify(command: TestEmailCommand) {
    return command.input;
  }

  private verify(input: TestEmailCommand['input']): void {
    if (!input.to || !input.to.includes('@')) {
      throw new Error('유효한 수신자 이메일 주소를 입력해주세요.');
    }
  }

  private async process(input: TestEmailCommand['input']): Promise<TestEmailResponseDto> {
    try {
      await this.notificationService.sendEmail({
        to: input.to,
        subject: '🔔 [시스템 설정] 이메일 발송 테스트',
        text: '이메일 발송 연동이 정상적으로 작동하고 있습니다. 본 메일은 관리자 테스트 발송 메일입니다.',
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2 style="color: #0f172a;">🔔 이메일 발송 테스트</h2>
            <p style="color: #475569; font-size: 15px;">이메일 발송 연동이 정상적으로 작동하고 있습니다.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #64748b; font-size: 13px;">발송 시각: ${new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'medium' }).format(new Date())}</p>
          </div>
        `,
      }, input.config);

      return {
        success: true,
        message: `${input.to} 주소로 테스트 이메일이 성공적으로 발송되었습니다.`,
      };
    }
    catch (error) {
      const errMsg = error instanceof Error ? error.message : '알 수 없는 오류';
      return {
        success: false,
        message: `이메일 발송에 실패했습니다: ${errMsg}`,
      };
    }
  }
}
