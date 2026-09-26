import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessengerConfigDto, PushConfigDto, SmsConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { BaseDto } from '#/common/interfaces/base/base.dto';

export class TestSmsRequestDto extends BaseDto {
  @ApiProperty({ example: '01012345678' })
  @IsString()
  @IsNotEmpty()
  to!: string;

  @ApiPropertyOptional({ type: SmsConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SmsConfigDto)
  config?: SmsConfigDto;
}

export class TestPushRequestDto extends BaseDto {
  @ApiProperty({ example: 'device-token' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiPropertyOptional({ type: PushConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PushConfigDto)
  config?: PushConfigDto;
}

export class TestMessengerRequestDto extends BaseDto {
  @ApiProperty({ example: 'recipient-id' })
  @IsString()
  @IsNotEmpty()
  recipient!: string;

  @ApiPropertyOptional({ type: MessengerConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MessengerConfigDto)
  config?: MessengerConfigDto;
}

export class TestChannelResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '테스트 발송이 완료되었습니다.' })
  message!: string;
}
