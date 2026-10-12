import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class GenerateTwoFactorResponseDto extends BaseDto {
  @ApiProperty({ type: String })
  secret!: string;

  @ApiProperty({ type: Number, description: '인증 앱에서 생성해야 하는 코드 길이' })
  digits!: number;

  @ApiProperty({ type: Number, description: '인증 앱에서 생성해야 하는 코드 유효 주기(초)' })
  periodSeconds!: number;
}
