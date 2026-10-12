import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';

import { TestWebhookCommand } from './test-webhook.command';
import { TestWebhookRequestDto } from './test-webhook.request.dto';
import { TestWebhookResponseDto } from './test-webhook.response.dto';

@UserAuth()
@Controller()
export class SystemConfigWebhookController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiTags('system-configs')
  @Post('service-config/test-webhook')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestWebhookResponseDto)
  @ApiOperation({ summary: '웹훅 테스트 전송', operationId: 'SystemConfigController_testWebhook_v1' })
  testWebhook(@Body() input: TestWebhookRequestDto): Promise<TestWebhookResponseDto> {
    return this.commandBus.execute(new TestWebhookCommand(input));
  }
}
