import { ApiProperty } from '@nestjs/swagger';
import { EntityDto } from '@pkg/server-core/http/dto/base';
import { defineEnum } from '@pkg/shared/common';
import { IsBoolean, IsEnum, IsInt, IsUrl, Max, Min, ValidateIf } from 'class-validator';

import { SystemConfig } from '~/core/database/entities/system-configs';

export const WebhookType = defineEnum('WebhookType', {
  SLACK: 'SLACK',
  DISCORD: 'DISCORD',
  CHANNEL_TALK: 'CHANNEL_TALK',
  TEAMS: 'TEAMS',
} as const);

export type WebhookType = (typeof WebhookType)[keyof typeof WebhookType];

export class WebhookConfigDto extends EntityDto(SystemConfig) {
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

  @ApiProperty({ example: 'https://hooks.slack.com/services/...', description: '알림 수신 웹훅 URL', required: false })
  @ValidateIf((config: WebhookConfigDto) => config.enabled)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  webhookUrl!: string;

  static override parseEntity(entity: SystemConfig): WebhookConfigDto {
    return this.parse(entity.value).validate();
  }
}
