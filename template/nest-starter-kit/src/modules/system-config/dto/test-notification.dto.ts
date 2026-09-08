import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { SystemConfig } from '#/entities/system-config/system-config.entity';

import { EmailConfigDto, MessengerConfigDto, PushConfigDto, SmsConfigDto } from './notification-config.dto';

export class TestEmailRequestDto extends DtoType(SystemConfig) {
  @ApiProperty({ description: '테스트 이메일 수신자 주소', example: 'admin@example.com' })
  @IsEmail()
  to!: string;

  @ApiPropertyOptional({ type: EmailConfigDto, description: '테스트 발송에 즉시 적용할 이메일 설정 (미입력 시 저장된 DB 설정 사용)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmailConfigDto)
  config?: EmailConfigDto;
}

export class TestEmailResponseDto {
  @ApiProperty({ example: true, description: '전송 성공 여부' })
  success!: boolean;

  @ApiProperty({ example: '테스트 이메일이 성공적으로 발송되었습니다.', description: '결과 메시지' })
  message!: string;
}

export class TestSmsRequestDto extends DtoType(SystemConfig) {
  @ApiProperty({ description: '테스트 수신 휴대폰 번호', example: '01012345678' })
  @IsString()
  @IsNotEmpty()
  to!: string;

  @ApiPropertyOptional({ type: SmsConfigDto, description: '테스트 발송에 즉시 적용할 SMS 설정 (미입력 시 저장된 DB 설정 사용)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SmsConfigDto)
  config?: SmsConfigDto;
}

export class TestSmsResponseDto {
  @ApiProperty({ example: true, description: '전송 성공 여부' })
  success!: boolean;

  @ApiProperty({ example: '테스트 SMS가 성공적으로 발송되었습니다.', description: '결과 메시지' })
  message!: string;
}

export class TestPushRequestDto extends DtoType(SystemConfig) {
  @ApiProperty({ description: '테스트 수신 디바이스 토큰', example: 'fcm-device-token-sample...' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiPropertyOptional({ type: PushConfigDto, description: '테스트 발송에 즉시 적용할 푸시 설정 (미입력 시 저장된 DB 설정 사용)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PushConfigDto)
  config?: PushConfigDto;
}

export class TestPushResponseDto {
  @ApiProperty({ example: true, description: '전송 성공 여부' })
  success!: boolean;

  @ApiProperty({ example: '테스트 푸시 알림이 성공적으로 발송되었습니다.', description: '결과 메시지' })
  message!: string;
}

export class TestMessengerRequestDto extends DtoType(SystemConfig) {
  @ApiProperty({ description: '테스트 수신 대상 (휴대폰 번호 또는 사용자/챗 ID)', example: '01012345678' })
  @IsString()
  @IsNotEmpty()
  recipient!: string;

  @ApiPropertyOptional({ type: MessengerConfigDto, description: '테스트 발송에 즉시 적용할 메신저 설정 (미입력 시 저장된 DB 설정 사용)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MessengerConfigDto)
  config?: MessengerConfigDto;
}

export class TestMessengerResponseDto {
  @ApiProperty({ example: true, description: '전송 성공 여부' })
  success!: boolean;

  @ApiProperty({ example: '테스트 메신저 알림이 성공적으로 발송되었습니다.', description: '결과 메시지' })
  message!: string;
}
