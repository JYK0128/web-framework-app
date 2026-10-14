import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';

export class SendWebhookResponseDto extends BaseDto {
  @ApiProperty({ description: '쿨다운을 통과해 알림 처리 대상인지 여부' })
  accepted!: boolean;

  @ApiProperty({ description: '외부 웹훅 메시지 전송 여부' })
  sent!: boolean;
}
