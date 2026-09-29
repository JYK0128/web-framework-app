import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { CreateOAuthIconPresignedUrlCommand, SyncSystemConfigCommand, TestEmailCommand, TestMessengerCommand, TestPushCommand, TestSmsCommand, UpdateSystemSettingsCommand } from './commands';
import { TestAdminEmailCommand } from './commands/test-admin-email.command';
import { TestWebhookCommand } from './commands/test-webhook.command';
import { TestAdminEmailRequestDto, TestAdminEmailResponseDto } from './dto/admin-email/test-email.dto';
import { CreateOAuthIconPresignedUrlRequestDto, CreateOAuthIconPresignedUrlResponseDto } from './dto/create-oauth-icon-presigned-url.dto';
import { TestChannelResponseDto, TestMessengerRequestDto, TestPushRequestDto, TestSmsRequestDto } from './dto/delivery/test-channel.dto';
import { TestEmailRequestDto, TestEmailResponseDto } from './dto/delivery/test-email.dto';
import { TestWebhookRequestDto, TestWebhookResponseDto } from './dto/webhook/test-webhook.dto';
import { GetSystemConfigQuery } from './queries';
import { GetAdminEmailConfigQuery } from './queries/get-admin-email-config.query';
import { GetAdminWebhookConfigQuery } from './queries/get-admin-webhook-config.query';
import { SyncSystemConfigRequestDto, SyncSystemConfigResponseDto, SystemSettingsResponseDto, UpdateSystemConfigResponseDto, UpdateSystemSettingsRequestDto } from './system-config.interfaces';

@ApiTags('system-configs')
@UserAuth()
@Controller()
export class SystemConfigController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('system-config')
  @Permissions(Permission.system.read)
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
  @Permissions(Permission.system.update)
  @SwaggerApiResponse(TestAdminEmailResponseDto)
  @ApiOperation({ summary: '시스템 설정 관리자 이메일 테스트 전송' })
  testAdminEmail(@Body() input: TestAdminEmailRequestDto): Promise<TestAdminEmailResponseDto> {
    return this.commandBus.execute(new TestAdminEmailCommand(input));
  }

  @Patch('system-config')
  @Permissions(Permission.system.update)
  @SwaggerApiResponse(UpdateSystemConfigResponseDto)
  @ApiOperation({ summary: '시스템 설정 수정' })
  updateConfigs(@Body() input: UpdateSystemSettingsRequestDto): Promise<UpdateSystemConfigResponseDto> {
    return this.commandBus.execute(new UpdateSystemSettingsCommand(input));
  }

  @Post('service-config/sync')
  @Permissions(Permission.system.update)
  @SwaggerApiResponse(SyncSystemConfigResponseDto)
  @ApiOperation({ summary: '서비스 설정을 Redis에 동기화' })
  syncConfigs(): Promise<SyncSystemConfigResponseDto> {
    return this.commandBus.execute(new SyncSystemConfigCommand(new SyncSystemConfigRequestDto()));
  }

  @Post('service-config/test-webhook')
  @Permissions(Permission.system.update)
  @SwaggerApiResponse(TestWebhookResponseDto)
  @ApiOperation({ summary: '웹훅 테스트 전송' })
  testWebhook(@Body() input: TestWebhookRequestDto): Promise<TestWebhookResponseDto> {
    return this.commandBus.execute(new TestWebhookCommand(input));
  }

  @Post('service-config/test-email')
  @Permissions(Permission.system.update)
  @SwaggerApiResponse(TestEmailResponseDto)
  @ApiOperation({ summary: '이메일 테스트 전송' })
  testEmail(@Body() input: TestEmailRequestDto): Promise<TestEmailResponseDto> {
    return this.commandBus.execute(new TestEmailCommand(input));
  }

  @Post('service-config/test-sms')
  @Permissions(Permission.system.update)
  @SwaggerApiResponse(TestChannelResponseDto)
  @ApiOperation({ summary: 'SMS 테스트 전송' })
  testSms(@Body() input: TestSmsRequestDto): Promise<TestChannelResponseDto> {
    return this.commandBus.execute(new TestSmsCommand(input));
  }

  @Post('service-config/test-push')
  @Permissions(Permission.system.update)
  @SwaggerApiResponse(TestChannelResponseDto)
  @ApiOperation({ summary: '푸시 테스트 전송' })
  testPush(@Body() input: TestPushRequestDto): Promise<TestChannelResponseDto> {
    return this.commandBus.execute(new TestPushCommand(input));
  }

  @Post('service-config/test-messenger')
  @Permissions(Permission.system.update)
  @SwaggerApiResponse(TestChannelResponseDto)
  @ApiOperation({ summary: '메신저 테스트 전송' })
  testMessenger(@Body() input: TestMessengerRequestDto): Promise<TestChannelResponseDto> {
    return this.commandBus.execute(new TestMessengerCommand(input));
  }

  @Post('service-config/oauth-icon/presigned-url')
  @Permissions(Permission.system.update)
  @SwaggerApiResponse(CreateOAuthIconPresignedUrlResponseDto)
  @ApiOperation({ summary: 'OAuth 아이콘 업로드 URL 발급' })
  createOAuthIconPresignedUrl(@Body() input: CreateOAuthIconPresignedUrlRequestDto): Promise<CreateOAuthIconPresignedUrlResponseDto> {
    return this.commandBus.execute(new CreateOAuthIconPresignedUrlCommand(input));
  }
}
