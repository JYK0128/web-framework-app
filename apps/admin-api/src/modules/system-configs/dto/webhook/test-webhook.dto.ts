import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUrl } from 'class-validator';

import { BaseDto } from '#/common/interfaces/base/base.dto';
import { OkResponseDto } from '#/common/interfaces/response';

import { WebhookType } from './webhook-config.dto';

export class TestWebhookRequestDto extends BaseDto {
  @ApiProperty({ example: 'SLACK', enum: WebhookType, description: '웹훅 채널 종류' })
  @IsEnum(WebhookType)
  type!: WebhookType;

  @ApiProperty({ example: 'https://hooks.slack.com/services/...', description: '테스트 전송할 웹훅 URL' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  webhookUrl!: string;
}

export class TestWebhookResponseDto extends OkResponseDto {}
