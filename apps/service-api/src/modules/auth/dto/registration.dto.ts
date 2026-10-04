import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

import { SECURITY_CONFIG } from '#/app.config';
import { BaseDto } from '#/common/dto/base.dto';
import { OkResponseDto } from '#/common/interfaces/response';

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

export class RegisterResponseDto extends BaseDto {
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

export class EmailVerificationResponseDto extends OkResponseDto {}

export class ResendEmailVerificationResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean, description: '계정 존재 여부와 무관하게 요청을 접수했다는 표시' })
  accepted!: boolean;
}

export class RequestPasswordResetDto {
  @ApiProperty({ type: String, format: 'email' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string;

  @ApiProperty({ type: String, example: '01012345678' })
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/[^0-9+]/g, '') : value)
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;
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

export class PasswordResetAcceptedDto extends BaseDto {
  @ApiProperty({ type: Boolean })
  accepted!: boolean;
}

export class PasswordResetResponseDto extends OkResponseDto {}
