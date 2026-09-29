import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

import { SECURITY_CONFIG } from '#/app.config';

export class RegisterRequestDto {
  @ApiProperty({ type: String, format: 'email' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string;

  @ApiProperty({ type: String, minLength: SECURITY_CONFIG.password.minLength, maxLength: SECURITY_CONFIG.password.maxLength })
  @IsString()
  @MinLength(SECURITY_CONFIG.password.minLength)
  @MaxLength(SECURITY_CONFIG.password.maxLength)
  password!: string;

  @ApiProperty({ type: String, maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}

export class RegisterResponseDto {
  @ApiProperty({ type: Boolean })
  emailVerificationRequired!: boolean;

  @ApiProperty({ type: Boolean })
  verificationEmailSent!: boolean;
}

export class ResendEmailVerificationRequestDto {
  @ApiProperty({ type: String, format: 'email' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string;
}

export class VerifyEmailRequestDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  challengeId!: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class EmailVerificationResponseDto {
  @ApiProperty({ type: Boolean })
  emailVerified!: boolean;
}

export class ResendEmailVerificationResponseDto {
  @ApiProperty({ type: Boolean, description: '계정 존재 여부와 무관하게 요청을 접수했다는 표시' })
  accepted!: boolean;
}

export class RequestPasswordResetDto {
  @ApiProperty({ type: String, format: 'email' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  challengeId!: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ type: String, minLength: SECURITY_CONFIG.password.minLength, maxLength: SECURITY_CONFIG.password.maxLength })
  @IsString()
  @MinLength(SECURITY_CONFIG.password.minLength)
  @MaxLength(SECURITY_CONFIG.password.maxLength)
  newPassword!: string;
}

export class PasswordResetAcceptedDto {
  @ApiProperty({ type: Boolean })
  accepted!: boolean;
}

export class PasswordResetResponseDto {
  @ApiProperty({ type: Boolean })
  ok!: boolean;
}
