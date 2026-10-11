import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { TestAdminEmailCommand } from '#/modules/system-configs/commands';
import type { TestAdminEmailResponseDto } from '#/modules/system-configs/dto/admin-email/test-admin-email.response.dto';
import { SystemConfigService } from '#/modules/system-configs/system-config.service';

@Injectable()
@CommandHandler(TestAdminEmailCommand)
export class TestAdminEmailHandler implements ICommandHandler<TestAdminEmailCommand, TestAdminEmailResponseDto> {
  constructor(private readonly service: SystemConfigService) {}
  execute(command: TestAdminEmailCommand): Promise<TestAdminEmailResponseDto> { return this.service.sendTestEmail(command.input.to); }
}
