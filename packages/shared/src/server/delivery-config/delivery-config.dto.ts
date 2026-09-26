import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';

import { EmailConfigDto } from './email-config.dto';
import { MessengerConfigDto } from './messenger-config.dto';
import { PushConfigDto } from './push-config.dto';
import { SmsConfigDto } from './sms-config.dto';

@ApiSchema({ name: 'DeliveryConfigDto' })
export class DeliveryConfigDto {
  @ApiProperty({ type: EmailConfigDto, description: '이메일 발송 설정' })
  @IsDefined()
  @ValidateNested()
  @Type(() => EmailConfigDto)
  email!: EmailConfigDto;

  @ApiProperty({ type: MessengerConfigDto, description: '비즈니스 메신저 (카카오/라인/왓츠앱/텔레그램/위챗 중 택 1) 발송 설정' })
  @IsDefined()
  @ValidateNested()
  @Type(() => MessengerConfigDto)
  messenger!: MessengerConfigDto;

  @ApiProperty({ type: SmsConfigDto, description: 'SMS 문자 발송 설정' })
  @IsDefined()
  @ValidateNested()
  @Type(() => SmsConfigDto)
  sms!: SmsConfigDto;

  @ApiProperty({ type: PushConfigDto, description: '웹/모바일 푸시 알림 설정' })
  @IsDefined()
  @ValidateNested()
  @Type(() => PushConfigDto)
  push!: PushConfigDto;
}
