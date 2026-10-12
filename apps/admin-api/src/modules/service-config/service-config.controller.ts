import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, Req, Res } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';
import type { Request, Response } from 'express';

import { ADMIN_RUNTIME_CONFIG, SECURITY_CONFIG } from '#/app.config';
import { Public, UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';
import { InternalClient } from '#/core/http/internal-client';
import { CreateOAuthIconPresignedUrlRequestDto, CreateOAuthIconPresignedUrlResponseDto, GetHolidaysRequestDto, OperatingHolidayListResponseDto, ServiceConfigResponseDto, SyncSystemConfigRequestDto, SyncSystemConfigResponseDto, TestChannelResponseDto, TestEmailRequestDto, TestEmailResponseDto, TestMessengerRequestDto, TestPushRequestDto, TestSmsRequestDto, TestWebhookRequestDto, TestWebhookResponseDto, UpdateServiceConfigRequestDto } from '#/modules/service-config';
import { TestEmailCommand } from '#/modules/service-config/delivery/test-email.command';
import { TestMessengerCommand } from '#/modules/service-config/delivery/test-messenger.command';
import { TestPushCommand } from '#/modules/service-config/delivery/test-push.command';
import { TestSmsCommand } from '#/modules/service-config/delivery/test-sms.command';
import { TestWebhookCommand } from '#/modules/service-config/delivery/test-webhook.command';
import { CreateOAuthIconPresignedUrlCommand } from '#/modules/service-config/oauth/create-oauth-icon-presigned-url.command';
import { GetHolidaysQuery } from '#/modules/service-config/operation/get-holidays.query';
import { SyncSystemConfigCommand } from '#/modules/service-config/sync-system-config.command';
import { UpdateSystemConfigCommand } from '#/modules/service-config/update-system-config.command';
import { UpdateSystemConfigResponseDto } from '#/modules/system-config';
import { GetSystemConfigQuery } from '#/modules/system-config/get-system-config.query';

@UserAuth()
@Controller()
export class ServiceConfigController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly internalClient: InternalClient,
  ) {}

  @ApiTags('service-config')
  @Get('service-config')
  @Permissions(AdminPermission.system.read)
  @SwaggerApiResponse(ServiceConfigResponseDto)
  @ApiOperation({ summary: '서비스 설정 조회' })
  async getConfigs(): Promise<ServiceConfigResponseDto> {
    const config = await this.queryBus.execute(new GetSystemConfigQuery());
    return ServiceConfigResponseDto.parse({ operation: config.operation, maintenance: config.maintenance, inquiry: config.inquiry });
  }

  @ApiTags('service-config')
  @Get('service-config/holidays')
  @Permissions(AdminPermission.system.read)
  @SwaggerApiResponse(OperatingHolidayListResponseDto)
  @ApiOperation({ summary: '법정 공휴일 조회' })
  getHolidays(@Query() input: GetHolidaysRequestDto): Promise<OperatingHolidayListResponseDto> {
    return this.queryBus.execute(new GetHolidaysQuery({ query: input }));
  }

  @ApiTags('service-config')
  @Patch('service-config')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(UpdateSystemConfigResponseDto)
  @ApiOperation({ summary: '서비스 설정 전체 수정' })
  updateConfigs(@Body() input: UpdateServiceConfigRequestDto): Promise<UpdateSystemConfigResponseDto> {
    return this.commandBus.execute(new UpdateSystemConfigCommand(input));
  }

  @ApiTags('system-configs')
  @Post('service-config/sync')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(SyncSystemConfigResponseDto)
  @ApiOperation({ summary: '서비스 설정을 Redis에 동기화', operationId: 'SystemConfigController_syncConfigs_v1' })
  syncConfigs(): Promise<SyncSystemConfigResponseDto> {
    return this.commandBus.execute(new SyncSystemConfigCommand(new SyncSystemConfigRequestDto()));
  }

  @ApiTags('system-configs')
  @Post('service-config/test-webhook')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestWebhookResponseDto)
  @ApiOperation({ summary: '웹훅 테스트 전송', operationId: 'SystemConfigController_testWebhook_v1' })
  testWebhook(@Body() input: TestWebhookRequestDto): Promise<TestWebhookResponseDto> {
    return this.commandBus.execute(new TestWebhookCommand(input));
  }

  @ApiTags('system-configs')
  @Post('service-config/test-email')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestEmailResponseDto)
  @ApiOperation({ summary: '이메일 테스트 전송', operationId: 'SystemConfigController_testEmail_v1' })
  testEmail(@Body() input: TestEmailRequestDto): Promise<TestEmailResponseDto> {
    return this.commandBus.execute(new TestEmailCommand(input));
  }

  @ApiTags('system-configs')
  @Post('service-config/test-sms')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestChannelResponseDto)
  @ApiOperation({ summary: 'SMS 테스트 전송', operationId: 'SystemConfigController_testSms_v1' })
  testSms(@Body() input: TestSmsRequestDto): Promise<TestChannelResponseDto> {
    return this.commandBus.execute(new TestSmsCommand(input));
  }

  @ApiTags('system-configs')
  @Post('service-config/test-push')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestChannelResponseDto)
  @ApiOperation({ summary: '푸시 테스트 전송', operationId: 'SystemConfigController_testPush_v1' })
  testPush(@Body() input: TestPushRequestDto): Promise<TestChannelResponseDto> {
    return this.commandBus.execute(new TestPushCommand(input));
  }

  @ApiTags('system-configs')
  @Post('service-config/test-messenger')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestChannelResponseDto)
  @ApiOperation({ summary: '메신저 테스트 전송', operationId: 'SystemConfigController_testMessenger_v1' })
  testMessenger(@Body() input: TestMessengerRequestDto): Promise<TestChannelResponseDto> {
    return this.commandBus.execute(new TestMessengerCommand(input));
  }

  @ApiTags('system-configs')
  @Post('service-config/oauth-icon/presigned-url')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(CreateOAuthIconPresignedUrlResponseDto)
  @ApiOperation({ summary: 'OAuth 아이콘 업로드 URL 발급', operationId: 'SystemConfigController_createOAuthIconPresignedUrl_v1' })
  createOAuthIconPresignedUrl(@Body() input: CreateOAuthIconPresignedUrlRequestDto): Promise<CreateOAuthIconPresignedUrlResponseDto> {
    return this.commandBus.execute(new CreateOAuthIconPresignedUrlCommand(input));
  }

  @ApiExcludeEndpoint()
  @Public()
  @Put('uploads/oauth-icons/:filename')
  @HttpCode(HttpStatus.OK)
  async uploadOAuthIcon(@Param('filename') filename: string, @Req() request: Request): Promise<{ ok: true }> {
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!cleanFilename || cleanFilename !== filename) throw new BadRequestException('유효하지 않은 파일명입니다.');
    const body: unknown = request.body;
    if (!Buffer.isBuffer(body) || body.length < 1 || body.length > SECURITY_CONFIG.integrations.oauthIconMaxSizeBytes) {
      throw new BadRequestException(`OAuth 아이콘 파일 크기는 1바이트 이상 ${SECURITY_CONFIG.integrations.oauthIconMaxSizeBytes}바이트 이하여야 합니다.`);
    }
    const contentType = typeof request.headers['content-type'] === 'string' ? request.headers['content-type'] : 'application/octet-stream';
    await this.internalClient.upload(`/internal/system-configs/oauth-icons/${cleanFilename}`, body, contentType);
    return { ok: true };
  }

  @ApiExcludeEndpoint()
  @Public()
  @Get('uploads/oauth-icons/:filename')
  async getOAuthIcon(@Param('filename') filename: string, @Res() response: Response): Promise<void> {
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!cleanFilename || cleanFilename !== filename) throw new BadRequestException('유효하지 않은 파일명입니다.');
    const file = await this.internalClient.download(`/internal/system-configs/oauth-icons/${cleanFilename}`);
    response.setHeader('Content-Type', file.contentType);
    response.setHeader('Cache-Control', `public, max-age=${ADMIN_RUNTIME_CONFIG.oauthIconCacheMaxAgeSeconds}`);
    response.send(file.body);
  }
}
