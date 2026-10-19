import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { AdminPermission } from '@pkg/shared';

import { TestEmailCommand } from '#/modules/system-config/notification/test-email.command';
import { TestEmailRequestDto } from '#/modules/system-config/notification/test-email.request.dto';
import { TestEmailResponseDto } from '#/modules/system-config/notification/test-email.response.dto';
import { TestMessengerCommand } from '#/modules/system-config/notification/test-messenger.command';
import { TestMessengerRequestDto } from '#/modules/system-config/notification/test-messenger.request.dto';
import { TestMessengerResponseDto } from '#/modules/system-config/notification/test-messenger.response.dto';
import { TestPushCommand } from '#/modules/system-config/notification/test-push.command';
import { TestPushRequestDto } from '#/modules/system-config/notification/test-push.request.dto';
import { TestPushResponseDto } from '#/modules/system-config/notification/test-push.response.dto';
import { TestSmsCommand } from '#/modules/system-config/notification/test-sms.command';
import { TestSmsRequestDto } from '#/modules/system-config/notification/test-sms.request.dto';
import { TestSmsResponseDto } from '#/modules/system-config/notification/test-sms.response.dto';

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
  @SwaggerApiResponse(TestSmsResponseDto)
  @ApiOperation({ summary: 'SMS 테스트 전송', operationId: 'SystemConfigController_testSms_v1' })
  testSms(@Body() input: TestSmsRequestDto): Promise<TestSmsResponseDto> {
    return this.commandBus.execute(new TestSmsCommand(input));
  }

  @Post('test-push')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestPushResponseDto)
  @ApiOperation({ summary: '푸시 테스트 전송', operationId: 'SystemConfigController_testPush_v1' })
  testPush(@Body() input: TestPushRequestDto): Promise<TestPushResponseDto> {
    return this.commandBus.execute(new TestPushCommand(input));
  }

  @Post('test-messenger')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestMessengerResponseDto)
  @ApiOperation({ summary: '메신저 테스트 전송', operationId: 'SystemConfigController_testMessenger_v1' })
  testMessenger(@Body() input: TestMessengerRequestDto): Promise<TestMessengerResponseDto> {
    return this.commandBus.execute(new TestMessengerCommand(input));
  }
}
