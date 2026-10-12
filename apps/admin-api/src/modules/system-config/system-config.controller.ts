import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';
import { SystemSettingsResponseDto, TestAdminEmailRequestDto, TestAdminEmailResponseDto, UpdateSystemConfigResponseDto, UpdateSystemSettingsRequestDto } from '#/modules/system-config/dto';

import { TestAdminEmailCommand } from './commands/test-admin-email.command';
import { UpdateSystemSettingsCommand } from './commands/update-system-settings.command';
import { GetAdminEmailConfigQuery } from './queries/get-admin-email-config.query';
import { GetAdminWebhookConfigQuery } from './queries/get-admin-webhook-config.query';
import { GetSystemConfigQuery } from './queries/get-system-config.query';

@ApiTags('system-configs')
@UserAuth()
@Controller()
export class SystemConfigController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('system-config')
  @Permissions(AdminPermission.system.read)
  @SwaggerApiResponse(SystemSettingsResponseDto)
  @ApiOperation({ summary: '시스템 설정 조회' })
  async getConfigs(): Promise<SystemSettingsResponseDto> {
    const [config, adminEmail, webhook] = await Promise.all([
      this.queryBus.execute(new GetSystemConfigQuery()),
      this.queryBus.execute(new GetAdminEmailConfigQuery()),
      this.queryBus.execute(new GetAdminWebhookConfigQuery()),
    ]);
    return SystemSettingsResponseDto.parse({
      delivery: config.delivery,
      oauth: config.oauth,
      webhook,
      adminEmail,
    });
  }

  @Post('system-config/test-email')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestAdminEmailResponseDto)
  @ApiOperation({ summary: '시스템 설정 관리자 이메일 테스트 전송' })
  testAdminEmail(@Body() input: TestAdminEmailRequestDto): Promise<TestAdminEmailResponseDto> {
    return this.commandBus.execute(new TestAdminEmailCommand(input));
  }

  @Patch('system-config')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(UpdateSystemConfigResponseDto)
  @ApiOperation({ summary: '시스템 설정 수정' })
  updateConfigs(@Body() input: UpdateSystemSettingsRequestDto): Promise<UpdateSystemConfigResponseDto> {
    return this.commandBus.execute(new UpdateSystemSettingsCommand(input));
  }
}
