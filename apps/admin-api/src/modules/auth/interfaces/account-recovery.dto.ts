import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

import { BaseDto } from '#/common/interfaces/base/base.dto';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

import { SECURITY_CONFIG } from '#/app.config';

const trimLowercase = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value;
const compactPhoneNumber = ({ value }: { value: unknown }) => typeof value === 'string' ? value.replace(/[^0-9+]/g, '') : value;

export class FindIdRequestDto {
  @ApiProperty({ example: 'Super Admin' }) @IsString() @IsNotEmpty() name!: string;
  @ApiProperty({ example: '01012345678' }) @Transform(compactPhoneNumber) @IsString() @IsNotEmpty() phoneNumber!: string;
}
export class FindIdItemDto extends BaseDto {
  @ApiProperty() maskedEmail!: string;
  @ApiProperty() provider!: string;
}
export class FindIdResponseDto extends BaseDto {
  @ApiProperty({ type: [FindIdItemDto] }) @Type(() => FindIdItemDto) items!: FindIdItemDto[];
}
export class PasswordResetRequestDto {
  @ApiProperty() @Transform(trimLowercase) @IsEmail() email!: string;
  @ApiProperty({ example: '01012345678' }) @Transform(compactPhoneNumber) @IsString() @IsNotEmpty() phoneNumber!: string;
}
export class PasswordResetRequestResponseDto extends BaseDto { @ApiProperty() accepted!: boolean; }
export class PasswordResetResponseDto extends BaseDto { @ApiProperty() ok!: boolean; }
export class EmailVerificationRequestDto {
  @ApiProperty({ example: 'operator@example.com' }) @Transform(trimLowercase) @IsEmail() email!: string;
}
export class EmailVerificationRequestResponseDto extends BaseDto { @ApiProperty() accepted!: boolean; }
export class VerifyEmailDto { @ApiProperty() @IsString() @IsNotEmpty() challengeId!: string; @ApiProperty() @IsString() @IsNotEmpty() token!: string; }
export class VerifyEmailResponseDto extends BaseDto { @ApiProperty() emailVerified!: boolean; }
export class VerifyPasswordResetDto { @ApiProperty() @IsString() @IsNotEmpty() challengeId!: string; @ApiProperty() @IsString() @IsNotEmpty() token!: string; }
export class ResetPasswordDto extends VerifyPasswordResetDto { @ApiProperty({ minLength: SECURITY_CONFIG.password.minLength, maxLength: SECURITY_CONFIG.password.maxLength }) @IsString() @MinLength(SECURITY_CONFIG.password.minLength) @MaxLength(SECURITY_CONFIG.password.maxLength) newPassword!: string; }
