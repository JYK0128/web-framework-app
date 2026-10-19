import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { MachineAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { NoStore } from '@pkg/server-core/http/decorators/no-store.decorator';

import { SendWebhookCommand } from '#/modules/webhook/send-webhook.command';
import { SendWebhookRequestDto } from '#/modules/webhook/send-webhook.request.dto';
import { SendWebhookResponseDto } from '#/modules/webhook/send-webhook.response.dto';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/webhooks')
export class WebhooksController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('send')
  @NoStore()
  send(@Body() input: SendWebhookRequestDto): Promise<SendWebhookResponseDto> {
    return this.commandBus.execute(new SendWebhookCommand(input));
  }
}
