import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler, type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TestAdminEmailCommand } from '#/modules/system-configs/commands';
import type { AdminEmailConfigResponseDto } from '#/modules/system-configs/dto/admin-email/admin-email-config.dto';
import type { TestAdminEmailResponseDto } from '#/modules/system-configs/dto/admin-email/test-email.dto';
import { GetAdminEmailConfigQuery } from '#/modules/system-configs/queries/get-admin-email-config.query';
import { SystemConfigService } from '#/modules/system-configs/system-config.service';

@Injectable()
@QueryHandler(GetAdminEmailConfigQuery)
export class GetAdminEmailConfigHandler implements IQueryHandler<GetAdminEmailConfigQuery, AdminEmailConfigResponseDto> {
  constructor(private readonly service: SystemConfigService) {}
  execute(): Promise<AdminEmailConfigResponseDto> { return this.service.getResponse(); }
}

@Injectable()
@CommandHandler(TestAdminEmailCommand)
export class TestAdminEmailHandler implements ICommandHandler<TestAdminEmailCommand, TestAdminEmailResponseDto> {
  constructor(private readonly service: SystemConfigService) {}
  execute(command: TestAdminEmailCommand): Promise<TestAdminEmailResponseDto> { return this.service.sendTestEmail(command.input.to); }
}
