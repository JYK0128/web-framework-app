import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthPrincipal } from 'express-session';

import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SkipSanitize } from '#/common/decorators/skip-sanitize.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { TestMessengerCommand, TestPushCommand, TestSmsCommand } from '#/modules/system-config/commands/test-channel.command';
import { TestEmailCommand } from '#/modules/system-config/commands/test-email.command';
import { TestWebhookCommand } from '#/modules/system-config/commands/test-webhook.command';
import { UpdateSystemConfigCommand } from '#/modules/system-config/commands/update-system-config.command';
import { GetAdminSystemConfigRequestDto, GetAdminSystemConfigResponseDto, GetHolidaysRequestDto, GetHolidaysResponseDto, GetSystemConfigRequestDto, GetSystemConfigResponseDto, TestEmailRequestDto, TestEmailResponseDto, TestMessengerRequestDto, TestMessengerResponseDto, TestPushRequestDto, TestPushResponseDto, TestSmsRequestDto, TestSmsResponseDto, TestWebhookRequestDto, TestWebhookResponseDto, UpdateSystemConfigRequestDto, UpdateSystemConfigResponseDto } from '#/modules/system-config/dto';
import { GetAdminSystemConfigQuery } from '#/modules/system-config/queries/get-admin-system-config.query';
import { GetHolidaysQuery } from '#/modules/system-config/queries/get-holidays.query';
import { GetSystemConfigQuery } from '#/modules/system-config/queries/get-system-config.query';

@ApiTags('system-config')
@Controller('system-config')
export class SystemConfigController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @SkipSanitize()
  @Permission('system:manage')
  @ApiBearerAuth()
  @Patch('admin')
  @ApiOperation({
    summary: '시스템 전체 설정 일괄 수정',
    description: '운영, 점검, 보안, 문의 설정을 단일 트랜잭션으로 일괄 수정합니다.',
  })
  @SwaggerApiResponse(UpdateSystemConfigResponseDto)
  async updateSystemConfig(
    @Body() dto: UpdateSystemConfigRequestDto,
    @CurrentUser() user: AuthPrincipal,
  ): Promise<UpdateSystemConfigResponseDto> {
    return this.commandBus.execute(new UpdateSystemConfigCommand(dto, user));
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: '공개 앱 환경설정 조회',
    description: '점검 모드, 회원가입 허용 여부, 고객센터 운영시간 등 일반 사용자용 설정을 조회합니다.',
  })
  @SwaggerApiResponse(GetSystemConfigResponseDto)
  async getSystemConfig(
    @Query() query: GetSystemConfigRequestDto,
  ): Promise<GetSystemConfigResponseDto> {
    return this.queryBus.execute(new GetSystemConfigQuery({ query }));
  }

  @Permission('system:manage', 'system:read')
  @ApiBearerAuth()
  @Get('admin')
  @ApiOperation({
    summary: '관리자용 시스템 전체 설정 조회',
    description: '운영, 점검, 보안, 문의 4대 도메인 설정을 조회합니다. 관리자 권한이 필요합니다.',
  })
  @SwaggerApiResponse(GetAdminSystemConfigResponseDto)
  async getAdminSystemConfig(
    @Query() query: GetAdminSystemConfigRequestDto,
  ): Promise<GetAdminSystemConfigResponseDto> {
    return this.queryBus.execute(new GetAdminSystemConfigQuery({ query }));
  }

  @Permission('system:manage', 'system:read')
  @ApiBearerAuth()
  @Get('admin/holidays')
  @ApiOperation({
    summary: '공식 법정공휴일 목록 조회',
    description: '공공데이터포털 또는 공식 법정공휴일/대체공휴일 계산 엔진을 통해 대상 연도의 공휴일 목록을 조회합니다. (순수 조회 Query로 DB를 변경하지 않습니다)',
  })
  @SwaggerApiResponse(GetHolidaysResponseDto)
  async getHolidays(
    @Query() query: GetHolidaysRequestDto,
  ): Promise<GetHolidaysResponseDto> {
    return this.queryBus.execute(new GetHolidaysQuery({ query }));
  }

  @Permission('system:manage')
  @ApiBearerAuth()
  @Post('admin/test-webhook')
  @ApiOperation({
    summary: '관리자 알림 웹훅 테스트 전송',
    description: '입력된 웹훅 URL로 테스트 알림 메시지를 즉시 전송하여 수신 상태를 검증합니다.',
  })
  @SwaggerApiResponse(TestWebhookResponseDto)
  async testWebhook(
    @Body() dto: TestWebhookRequestDto,
  ): Promise<TestWebhookResponseDto> {
    return this.commandBus.execute(new TestWebhookCommand(dto));
  }

  @SkipSanitize()
  @Permission('system:manage')
  @ApiBearerAuth()
  @Post('admin/test-email')
  @ApiOperation({
    summary: '이메일 발송 테스트',
    description: '설정된 이메일 제공자(SMTP/NHN/SES/Google/Oracle)를 통해 테스트 메일을 즉시 발송하여 연동 상태를 검증합니다.',
  })
  @SwaggerApiResponse(TestEmailResponseDto)
  async testEmail(
    @Body() dto: TestEmailRequestDto,
  ): Promise<TestEmailResponseDto> {
    return this.commandBus.execute(new TestEmailCommand(dto));
  }

  @SkipSanitize()
  @Permission('system:manage')
  @ApiBearerAuth()
  @Post('admin/test-sms')
  @ApiOperation({
    summary: 'SMS 발송 테스트',
    description: '설정된 SMS 제공자(NHN/AWS SNS/Google/Oracle)를 통해 테스트 SMS를 즉시 발송하여 연동 상태를 검증합니다.',
  })
  @SwaggerApiResponse(TestSmsResponseDto)
  async testSms(
    @Body() dto: TestSmsRequestDto,
  ): Promise<TestSmsResponseDto> {
    return this.commandBus.execute(new TestSmsCommand(dto));
  }

  @SkipSanitize()
  @Permission('system:manage')
  @ApiBearerAuth()
  @Post('admin/test-push')
  @ApiOperation({
    summary: '푸시 알림 발송 테스트',
    description: '설정된 푸시 제공자(Firebase FCM/NHN/AWS SNS/Oracle ONS)를 통해 테스트 푸시 알림을 즉시 발송하여 연동 상태를 검증합니다.',
  })
  @SwaggerApiResponse(TestPushResponseDto)
  async testPush(
    @Body() dto: TestPushRequestDto,
  ): Promise<TestPushResponseDto> {
    return this.commandBus.execute(new TestPushCommand(dto));
  }

  @SkipSanitize()
  @Permission('system:manage')
  @ApiBearerAuth()
  @Post('admin/test-messenger')
  @ApiOperation({
    summary: '비즈니스 메신저 발송 테스트',
    description: '설정된 메신저 제공자(카카오/라인/왓츠앱/텔레그램/위챗)를 통해 테스트 메시지를 즉시 발송하여 연동 상태를 검증합니다.',
  })
  @SwaggerApiResponse(TestMessengerResponseDto)
  async testMessenger(
    @Body() dto: TestMessengerRequestDto,
  ): Promise<TestMessengerResponseDto> {
    return this.commandBus.execute(new TestMessengerCommand(dto));
  }
}
