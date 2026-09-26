import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsUrl, Max, Min } from 'class-validator';

import { defineEnum } from '#/common/schema/enum';

export const WebhookType = defineEnum('WebhookType', {
  SLACK: 'SLACK',
  DISCORD: 'DISCORD',
  CHANNEL_TALK: 'CHANNEL_TALK',
  TEAMS: 'TEAMS',
} as const);

export type WebhookType = (typeof WebhookType)[keyof typeof WebhookType];

export class WebhookConfigDto {
  @ApiProperty({ example: 10, description: '동일 문의 미응답 알림 재발송 간격 (분)' })
  @IsInt()
  @Min(1)
  @Max(1440)
  cooldownMinutes!: number;

  @ApiProperty({ example: true, description: '알림 연동 활성화 여부' })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ example: 'SLACK', enum: WebhookType, description: '웹훅 전송 채널 종류' })
  @IsEnum(WebhookType)
  type!: WebhookType;

  @ApiProperty({ example: 'https://hooks.slack.com/services/...', description: '알림 수신 웹훅 URL' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  webhookUrl!: string;
}
