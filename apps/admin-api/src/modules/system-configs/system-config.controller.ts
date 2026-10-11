import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';
import { TestAdminEmailRequestDto } from '#/modules/system-configs/dto/admin-email/test-admin-email.request.dto';
import { TestAdminEmailResponseDto } from '#/modules/system-configs/dto/admin-email/test-admin-email.response.dto';
import { CreateOAuthIconPresignedUrlRequestDto } from '#/modules/system-configs/dto/create-oauth-icon-presigned-url.request.dto';
import { CreateOAuthIconPresignedUrlResponseDto } from '#/modules/system-configs/dto/create-oauth-icon-presigned-url.response.dto';
import { TestChannelResponseDto } from '#/modules/system-configs/dto/delivery/test-channel.response.dto';
import { TestEmailRequestDto } from '#/modules/system-configs/dto/delivery/test-email.request.dto';
import { TestEmailResponseDto } from '#/modules/system-configs/dto/delivery/test-email.response.dto';
import { TestMessengerRequestDto } from '#/modules/system-configs/dto/delivery/test-messenger.request.dto';
import { TestPushRequestDto } from '#/modules/system-configs/dto/delivery/test-push.request.dto';
import { TestSmsRequestDto } from '#/modules/system-configs/dto/delivery/test-sms.request.dto';
import { SyncSystemConfigRequestDto } from '#/modules/system-configs/dto/sync-system-config.request.dto';
import { SyncSystemConfigResponseDto } from '#/modules/system-configs/dto/sync-system-config.response.dto';
import { SystemSettingsResponseDto } from '#/modules/system-configs/dto/system-settings.response.dto';
import { UpdateSystemConfigResponseDto } from '#/modules/system-configs/dto/update-system-config.response.dto';
import { UpdateSystemSettingsRequestDto } from '#/modules/system-configs/dto/update-system-settings.request.dto';
import { TestWebhookRequestDto } from '#/modules/system-configs/dto/webhook/test-webhook.request.dto';
import { TestWebhookResponseDto } from '#/modules/system-configs/dto/webhook/test-webhook.response.dto';

import { CreateOAuthIconPresignedUrlCommand, SyncSystemConfigCommand, TestEmailCommand, TestMessengerCommand, TestPushCommand, TestSmsCommand, UpdateSystemSettingsCommand } from './commands';
import { TestAdminEmailCommand } from './commands/test-admin-email.command';
import { TestWebhookCommand } from './commands/test-webhook.command';
import { GetSystemConfigQuery } from './queries';
import { GetAdminEmailConfigQuery } from './queries/get-admin-email-config.query';
import { GetAdminWebhookConfigQuery } from './queries/get-admin-webhook-config.query';

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
    return {
      delivery: config.delivery,
      oauth: config.oauth,
      webhook,
      adminEmail,
    };
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

  @Post('service-config/sync')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(SyncSystemConfigResponseDto)
  @ApiOperation({ summary: '서비스 설정을 Redis에 동기화' })
  syncConfigs(): Promise<SyncSystemConfigResponseDto> {
    return this.commandBus.execute(new SyncSystemConfigCommand(new SyncSystemConfigRequestDto()));
  }

  @Post('service-config/test-webhook')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestWebhookResponseDto)
  @ApiOperation({ summary: '웹훅 테스트 전송' })
  testWebhook(@Body() input: TestWebhookRequestDto): Promise<TestWebhookResponseDto> {
    return this.commandBus.execute(new TestWebhookCommand(input));
  }

  @Post('service-config/test-email')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestEmailResponseDto)
  @ApiOperation({ summary: '이메일 테스트 전송' })
  testEmail(@Body() input: TestEmailRequestDto): Promise<TestEmailResponseDto> {
    return this.commandBus.execute(new TestEmailCommand(input));
  }

  @Post('service-config/test-sms')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestChannelResponseDto)
  @ApiOperation({ summary: 'SMS 테스트 전송' })
  testSms(@Body() input: TestSmsRequestDto): Promise<TestChannelResponseDto> {
    return this.commandBus.execute(new TestSmsCommand(input));
  }

  @Post('service-config/test-push')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestChannelResponseDto)
  @ApiOperation({ summary: '푸시 테스트 전송' })
  testPush(@Body() input: TestPushRequestDto): Promise<TestChannelResponseDto> {
    return this.commandBus.execute(new TestPushCommand(input));
  }

  @Post('service-config/test-messenger')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestChannelResponseDto)
  @ApiOperation({ summary: '메신저 테스트 전송' })
  testMessenger(@Body() input: TestMessengerRequestDto): Promise<TestChannelResponseDto> {
    return this.commandBus.execute(new TestMessengerCommand(input));
  }

  @Post('service-config/oauth-icon/presigned-url')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(CreateOAuthIconPresignedUrlResponseDto)
  @ApiOperation({ summary: 'OAuth 아이콘 업로드 URL 발급' })
  createOAuthIconPresignedUrl(@Body() input: CreateOAuthIconPresignedUrlRequestDto): Promise<CreateOAuthIconPresignedUrlResponseDto> {
    return this.commandBus.execute(new CreateOAuthIconPresignedUrlCommand(input));
  }
}
