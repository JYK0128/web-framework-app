import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsString, IsUrl } from 'class-validator';

import { BaseDto } from '#/common/interfaces/base/base.dto';

import { WebhookType } from './webhook-config.dto';

export class TestWebhookRequestDto extends BaseDto {
  @ApiProperty({ example: 'SLACK', enum: WebhookType, description: '웹훅 채널 종류' })
  @IsEnum(WebhookType)
  type!: WebhookType;

  @ApiProperty({ example: 'https://hooks.slack.com/services/...', description: '테스트 전송할 웹훅 URL' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  webhookUrl!: string;
}

export class TestWebhookResponseDto {
  @ApiProperty({ example: true, description: '전송 성공 여부' })
  @IsBoolean()
  success!: boolean;

  @ApiProperty({ example: '테스트 알림이 성공적으로 전송되었습니다.', description: '결과 메시지' })
  @IsString()
  message!: string;
}
