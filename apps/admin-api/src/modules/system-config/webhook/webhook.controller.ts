import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';

import { SyncWebhookConfigCommand } from './sync-webhook-config.command';
import { SyncWebhookConfigResponseDto } from './sync-webhook-config.response.dto';
import { TestWebhookCommand } from './test-webhook.command';
import { TestWebhookRequestDto } from './test-webhook.request.dto';
import { TestWebhookResponseDto } from './test-webhook.response.dto';

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

  @Post('sync')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(SyncWebhookConfigResponseDto)
  @ApiOperation({ summary: '웹훅 설정 동기화', operationId: 'SystemConfigController_syncConfigs_v1' })
  syncWebhookConfig(): Promise<SyncWebhookConfigResponseDto> {
    return this.commandBus.execute(new SyncWebhookConfigCommand());
  }
}
