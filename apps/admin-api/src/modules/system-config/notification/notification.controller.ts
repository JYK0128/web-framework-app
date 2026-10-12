import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';

import { TestChannelResponseDto } from './test-channel.response.dto';
import { TestEmailCommand } from './test-email.command';
import { TestEmailRequestDto } from './test-email.request.dto';
import { TestEmailResponseDto } from './test-email.response.dto';
import { TestMessengerCommand } from './test-messenger.command';
import { TestMessengerRequestDto } from './test-messenger.request.dto';
import { TestPushCommand } from './test-push.command';
import { TestPushRequestDto } from './test-push.request.dto';
import { TestSmsCommand } from './test-sms.command';
import { TestSmsRequestDto } from './test-sms.request.dto';

@ApiTags('system-configs')
@UserAuth()
@Controller('system-config/notification')
export class SystemConfigNotificationController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('test-email')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestEmailResponseDto)
  @ApiOperation({ summary: '이메일 테스트 전송', operationId: 'SystemConfigController_testEmail_v1' })
  testEmail(@Body() input: TestEmailRequestDto): Promise<TestEmailResponseDto> {
    return this.commandBus.execute(new TestEmailCommand(input));
  }

  @Post('test-sms')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestChannelResponseDto)
  @ApiOperation({ summary: 'SMS 테스트 전송', operationId: 'SystemConfigController_testSms_v1' })
  testSms(@Body() input: TestSmsRequestDto): Promise<TestChannelResponseDto> {
    return this.commandBus.execute(new TestSmsCommand(input));
  }

  @Post('test-push')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestChannelResponseDto)
  @ApiOperation({ summary: '푸시 테스트 전송', operationId: 'SystemConfigController_testPush_v1' })
  testPush(@Body() input: TestPushRequestDto): Promise<TestChannelResponseDto> {
    return this.commandBus.execute(new TestPushCommand(input));
  }

  @Post('test-messenger')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestChannelResponseDto)
  @ApiOperation({ summary: '메신저 테스트 전송', operationId: 'SystemConfigController_testMessenger_v1' })
  testMessenger(@Body() input: TestMessengerRequestDto): Promise<TestChannelResponseDto> {
    return this.commandBus.execute(new TestMessengerCommand(input));
  }
}
