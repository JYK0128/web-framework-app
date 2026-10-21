import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { IsEnum, IsUrl } from 'class-validator';

import { WebhookType } from '~/modules/system-config/webhook/webhook-config.dto';

export class TestWebhookRequestDto extends BaseDto {
  @ApiProperty({ example: 'SLACK', enum: WebhookType, description: '웹훅 채널 종류' })
  @IsEnum(WebhookType)
  type!: WebhookType;

  @ApiProperty({ example: 'https://hooks.slack.com/services/...', description: '테스트 전송할 웹훅 URL' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  webhookUrl!: string;
}
