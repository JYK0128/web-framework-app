import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { AdminPermission } from '@pkg/shared';

import { TestWebhookCommand } from '#/modules/system-config/webhook/test-webhook.command';
import { TestWebhookRequestDto } from '#/modules/system-config/webhook/test-webhook.request.dto';
import { TestWebhookResponseDto } from '#/modules/system-config/webhook/test-webhook.response.dto';

@ApiTags('system-configs')
@UserAuth()
@Controller('system-config/webhook')
export class SystemConfigWebhookController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('test')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestWebhookResponseDto)
  @ApiOperation({ summary: '웹훅 테스트 전송', operationId: 'SystemConfigController_testWebhook_v1' })
  testWebhook(@Body() input: TestWebhookRequestDto): Promise<TestWebhookResponseDto> {
    return this.commandBus.execute(new TestWebhookCommand(input));
  }
}
