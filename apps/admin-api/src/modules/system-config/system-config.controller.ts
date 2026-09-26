import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { CreateOAuthIconPresignedUrlCommand, SyncSystemConfigCommand, TestEmailCommand, TestMessengerCommand, TestPushCommand, TestSmsCommand, UpdateSystemConfigCommand } from './commands';
import { TestWebhookCommand } from './commands/test-webhook.command';
import { CreateOAuthIconPresignedUrlRequestDto, CreateOAuthIconPresignedUrlResponseDto } from './dto/create-oauth-icon-presigned-url.dto';
import { GetHolidaysRequestDto } from './dto/get-holidays.request.dto';
import { GetHolidaysResponseDto } from './dto/get-holidays.response.dto';
import { TestWebhookRequestDto, TestWebhookResponseDto } from './dto/inquiry-config.dto';
import { TestChannelResponseDto, TestMessengerRequestDto, TestPushRequestDto, TestSmsRequestDto } from './dto/test-channel.dto';
import { TestEmailRequestDto, TestEmailResponseDto } from './dto/test-email.dto';
import { GetHolidaysQuery, GetSystemConfigQuery } from './queries';
import { SyncSystemConfigRequestDto, SyncSystemConfigResponseDto, SystemConfigResponseDto, UpdateSystemConfigRequestDto, UpdateSystemConfigResponseDto } from './system-config.interfaces';

@ApiTags('system-config')
@UserAuth()
@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get()
  @Permissions(Permission.system.read)
  @SwaggerApiResponse(SystemConfigResponseDto)
  @ApiOperation({ summary: '시스템 설정 조회' })
  getConfigs(): Promise<SystemConfigResponseDto> { return this.queryBus.execute(new GetSystemConfigQuery()); }

  @Get('holidays')
  @Permissions(Permission.system.read)
  @SwaggerApiResponse(GetHolidaysResponseDto)
  @ApiOperation({ summary: '법정 공휴일 조회' })
  getHolidays(@Query() input: GetHolidaysRequestDto): Promise<GetHolidaysResponseDto> {
    return this.queryBus.execute(new GetHolidaysQuery({ query: input }));
  }

  @Patch()
  @Permissions(Permission.system.update)
  @SwaggerApiResponse(UpdateSystemConfigResponseDto)
  @ApiOperation({ summary: '시스템 설정 수정' })
  updateConfigs(@Body() input: UpdateSystemConfigRequestDto): Promise<UpdateSystemConfigResponseDto> {
    return this.commandBus.execute(new UpdateSystemConfigCommand(input));
  }

  @Post('sync')
  @Permissions(Permission.system.update)
  @SwaggerApiResponse(SyncSystemConfigResponseDto)
  @ApiOperation({ summary: '서비스 설정을 Redis에 동기화' })
  syncConfigs(): Promise<SyncSystemConfigResponseDto> {
    return this.commandBus.execute(new SyncSystemConfigCommand(new SyncSystemConfigRequestDto()));
  }

  @Post('test-webhook')
  @Permissions(Permission.system.update)
  @SwaggerApiResponse(TestWebhookResponseDto)
  @ApiOperation({ summary: '웹훅 테스트 전송' })
  testWebhook(@Body() input: TestWebhookRequestDto): Promise<TestWebhookResponseDto> {
    return this.commandBus.execute(new TestWebhookCommand(input));
  }

  @Post('test-email')
  @Permissions(Permission.system.update)
  @SwaggerApiResponse(TestEmailResponseDto)
  @ApiOperation({ summary: '이메일 테스트 전송' })
  testEmail(@Body() input: TestEmailRequestDto): Promise<TestEmailResponseDto> {
    return this.commandBus.execute(new TestEmailCommand(input));
  }

  @Post('test-sms')
  @Permissions(Permission.system.update)
  @SwaggerApiResponse(TestChannelResponseDto)
  @ApiOperation({ summary: 'SMS 테스트 전송' })
  testSms(@Body() input: TestSmsRequestDto): Promise<TestChannelResponseDto> {
    return this.commandBus.execute(new TestSmsCommand(input));
  }

  @Post('test-push')
  @Permissions(Permission.system.update)
  @SwaggerApiResponse(TestChannelResponseDto)
  @ApiOperation({ summary: '푸시 테스트 전송' })
  testPush(@Body() input: TestPushRequestDto): Promise<TestChannelResponseDto> {
    return this.commandBus.execute(new TestPushCommand(input));
  }

  @Post('test-messenger')
  @Permissions(Permission.system.update)
  @SwaggerApiResponse(TestChannelResponseDto)
  @ApiOperation({ summary: '메신저 테스트 전송' })
  testMessenger(@Body() input: TestMessengerRequestDto): Promise<TestChannelResponseDto> {
    return this.commandBus.execute(new TestMessengerCommand(input));
  }

  @Post('oauth-icon/presigned-url')
  @Permissions(Permission.system.update)
  @SwaggerApiResponse(CreateOAuthIconPresignedUrlResponseDto)
  @ApiOperation({ summary: 'OAuth 아이콘 업로드 URL 발급' })
  createOAuthIconPresignedUrl(@Body() input: CreateOAuthIconPresignedUrlRequestDto): Promise<CreateOAuthIconPresignedUrlResponseDto> {
    return this.commandBus.execute(new CreateOAuthIconPresignedUrlCommand(input));
  }
}
