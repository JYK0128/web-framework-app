import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlimtalkMessageDto, MessengerConfigDto, PushConfigDto, SmsConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { OkResponseDto } from '#/core/http/dto/response';

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

  @ApiPropertyOptional({ type: AlimtalkMessageDto, description: '카카오 알림톡 테스트 시 필수' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AlimtalkMessageDto)
  alimtalk?: AlimtalkMessageDto;

  @ApiPropertyOptional({ type: MessengerConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MessengerConfigDto)
  config?: MessengerConfigDto;
}

export class TestChannelResponseDto extends OkResponseDto {}
