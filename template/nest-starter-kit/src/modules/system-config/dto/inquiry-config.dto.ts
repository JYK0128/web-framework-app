import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsString, Max, Min, ValidateNested } from 'class-validator';

import { defineEnum } from '#/common/dto/enum';

export const InquiryNotificationType = defineEnum('InquiryNotificationType', {
  SLACK: 'SLACK',
  DISCORD: 'DISCORD',
  CHANNEL_TALK: 'CHANNEL_TALK',
} as const);

export type InquiryNotificationType = (typeof InquiryNotificationType)[keyof typeof InquiryNotificationType];

export class InquiryNotificationDto {
  @ApiProperty({ example: true, description: '알림 연동 활성화 여부' })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ example: 'SLACK', enum: InquiryNotificationType, description: '알림 전송 채널 종류' })
  @IsEnum(InquiryNotificationType)
  type!: InquiryNotificationType;

  @ApiProperty({ example: 'https://hooks.slack.com/services/...', description: '알림 수신 웹훅 URL' })
  @IsString()
  webhookUrl!: string;
}

export class TestWebhookRequestDto {
  @ApiProperty({ example: 'SLACK', enum: InquiryNotificationType, description: '알림 채널 종류' })
  @IsEnum(InquiryNotificationType)
  type!: InquiryNotificationType;

  @ApiProperty({ example: 'https://hooks.slack.com/services/...', description: '테스트 전송할 웹훅 URL' })
  @IsString()
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

export class InquiryConfigDto {
  @ApiProperty({ example: 10, description: '미응답 문의 감지 기준 시간 (분)' })
  @IsInt()
  @Min(1)
  @Max(120)
  unansweredThresholdMinutes!: number;

  @ApiProperty({ example: 72, description: '문의 자동 종료 기준 시간 (시간)' })
  @IsInt()
  @Min(1)
  @Max(720)
  autoCloseHours!: number;

  @ApiProperty({ type: InquiryNotificationDto, description: '문의 관리자 알림 연동 설정' })
  @ValidateNested()
  @Type(() => InquiryNotificationDto)
  notification!: InquiryNotificationDto;
}
