import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, Max, Min, ValidateNested } from 'class-validator';

import { ToNumber } from '#/common/decorators/to-number.decorator';

export class RegistrationConfigDto {
  @ApiProperty({ example: true, description: '신규 회원가입 허용 여부' })
  @IsBoolean()
  allowRegistration!: boolean;
}

export class SessionConfigDto {
  @ApiProperty({ example: 30, description: '유휴 세션 자동 로그아웃 시간 (분)' })
  @ToNumber()
  @IsInt()
  @Min(10)
  @Max(1440)
  sessionTimeoutMinutes!: number;

  @ApiProperty({ example: false, description: '동일 계정 중복 로그인 제한 여부' })
  @IsBoolean()
  preventConcurrentLogin!: boolean;
}

export class LockoutConfigDto {
  @ApiProperty({ example: 5, description: '로그인 실패 허용 횟수' })
  @ToNumber()
  @IsInt()
  @Min(3)
  @Max(20)
  maxFailureAttempts!: number;

  @ApiProperty({ example: 15, description: '계정 잠금 지속 시간 (분)' })
  @ToNumber()
  @IsInt()
  @Min(1)
  @Max(1440)
  lockoutDurationMinutes!: number;
}

export class PasswordPolicyDto {
  @ApiProperty({ example: 90, description: '비밀번호 변경 만료 주기 (일, 0 설정 시 만료 없음)' })
  @ToNumber()
  @IsInt()
  @Min(0)
  @Max(365)
  expirationDays!: number;

  @ApiProperty({ example: 8, description: '비밀번호 최소 자릿수' })
  @ToNumber()
  @IsInt()
  @Min(8)
  @Max(32)
  minLength!: number;

  @ApiProperty({ example: true, description: '특수문자 필수 포함 여부' })
  @IsBoolean()
  requireSpecialChar!: boolean;
}

export class SecurityConfigDto {
  @ApiProperty({ type: RegistrationConfigDto, description: '신규 회원가입 정책' })
  @ValidateNested()
  @Type(() => RegistrationConfigDto)
  registration!: RegistrationConfigDto;

  @ApiProperty({ type: SessionConfigDto, description: '세션 및 접속 보안 정책' })
  @ValidateNested()
  @Type(() => SessionConfigDto)
  session!: SessionConfigDto;

  @ApiProperty({ type: LockoutConfigDto, description: '로그인 실패 및 계정 잠금 정책' })
  @ValidateNested()
  @Type(() => LockoutConfigDto)
  lockout!: LockoutConfigDto;

  @ApiProperty({ type: PasswordPolicyDto, description: '비밀번호 보안 정책' })
  @ValidateNested()
  @Type(() => PasswordPolicyDto)
  password!: PasswordPolicyDto;
}
