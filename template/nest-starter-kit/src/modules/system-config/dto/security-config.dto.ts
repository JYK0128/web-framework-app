import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, Max, Min, ValidateNested } from 'class-validator';

import { ToNumber } from '#/common/decorators/to-number.decorator';

export class RegistrationConfigDto {
  @ApiProperty({ example: true, description: '전체 신규 회원가입 허용 여부' })
  @IsBoolean()
  allowRegistration!: boolean;

  @ApiProperty({ example: true, description: '로컬(이메일/비밀번호) 회원가입 허용 여부' })
  @IsBoolean()
  allowPasswordRegistration!: boolean;

  @ApiProperty({ example: true, description: '회원가입 시 이메일 인증 필수 여부' })
  @IsBoolean()
  requireEmailVerification!: boolean;
}

export class SessionConfigDto {
  @ApiProperty({ example: false, description: '동일 계정 중복 로그인 제한 여부' })
  @IsBoolean()
  preventConcurrentLogin!: boolean;

  @ApiProperty({ example: 30, description: '세션 만료 시간 (분)' })
  @ToNumber()
  @IsInt()
  @Min(1)
  @Max(1440)
  timeoutMinutes!: number;

  @ApiProperty({ example: 43200, description: '로그인 상태 유지 기간 (분)' })
  @ToNumber()
  @IsInt()
  @Min(1)
  @Max(525600)
  rememberMeTtlMinutes!: number;
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
  @ApiProperty({ example: 30, description: '비밀번호 변경 유예 기간 (일)' })
  @ToNumber()
  @IsInt()
  @Min(1)
  @Max(365)
  changeDeferDays!: number;

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

  @ApiProperty({ example: true, description: '숫자 필수 포함 여부' })
  @IsBoolean()
  requireNumbers!: boolean;

  @ApiProperty({ example: false, description: '영문 대문자 필수 포함 여부' })
  @IsBoolean()
  requireUppercase!: boolean;

  @ApiProperty({ example: 3, description: '이전 비밀번호 재사용 금지 개수 (0~10)' })
  @ToNumber()
  @IsInt()
  @Min(0)
  @Max(10)
  historyLimit!: number;
}

export class TwoFactorConfigDto {
  @ApiProperty({ example: false, description: '관리자 계정 2단계 인증 의무화 여부' })
  @IsBoolean()
  enforceAdmin2FA!: boolean;

  @ApiProperty({ example: true, description: '일반 사용자 2단계 인증 활성화 허용 여부' })
  @IsBoolean()
  allowUser2FA!: boolean;

  @ApiProperty({ example: 10, description: '2FA challenge 유효기간 (분)' })
  @ToNumber()
  @IsInt()
  @Min(1)
  @Max(60)
  challengeTtlMinutes!: number;
}

export class VerificationConfigDto {
  @ApiProperty({ example: 15, description: '이메일 인증 유효기간 (가입 및 변경 포함, 분)' })
  @ToNumber() @IsInt() @Min(1) @Max(1440)
  emailChallengeExpiryMinutes!: number;

  @ApiProperty({ example: 15, description: '비밀번호 재설정 유효기간 (분)' })
  @ToNumber() @IsInt() @Min(1) @Max(1440)
  passwordResetChallengeExpiryMinutes!: number;

  @ApiProperty({ example: 5, description: '휴대전화 인증 유효기간 (분)' })
  @ToNumber() @IsInt() @Min(1) @Max(1440)
  phoneChallengeExpiryMinutes!: number;
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

  @ApiProperty({ type: TwoFactorConfigDto, description: '2단계 인증(2FA) 정책' })
  @ValidateNested()
  @Type(() => TwoFactorConfigDto)
  twoFactor!: TwoFactorConfigDto;

  @ApiProperty({ example: 10, description: 'OAuth state 유효기간 (분)' })
  @ToNumber() @IsInt() @Min(1) @Max(60)
  oauthStateTtlMinutes!: number;

  @ApiProperty({ type: VerificationConfigDto, description: '인증 challenge 유효기간 정책' })
  @ValidateNested()
  @Type(() => VerificationConfigDto)
  verification!: VerificationConfigDto;
}
