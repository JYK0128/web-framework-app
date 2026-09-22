import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { EntityDto } from '#/common/interfaces/base/entity.dto';
import { SystemConfig } from '#/entities/system-configs/system-config.entity';

import { MessengerConfigDto, PushConfigDto, SmsConfigDto } from './notification-config.dto';

export class TestSmsRequestDto extends EntityDto(SystemConfig) {
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

export class TestPushRequestDto extends EntityDto(SystemConfig) {
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

export class TestMessengerRequestDto extends EntityDto(SystemConfig) {
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
