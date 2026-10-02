import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

import { SECURITY_CONFIG } from '#/app.config';

const trimLowercase = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value;
const compactPhoneNumber = ({ value }: { value: unknown }) => typeof value === 'string' ? value.replace(/[^0-9+]/g, '') : value;

export class FindIdRequestDto {
  @ApiProperty({ example: 'Super Admin' }) @IsString() @IsNotEmpty() name!: string;
  @ApiProperty({ example: '01012345678' }) @Transform(compactPhoneNumber) @IsString() @IsNotEmpty() phoneNumber!: string;
}
export class FindIdResponseDto {
  @ApiProperty({ type: [Object] }) items!: Array<{ maskedEmail: string, provider: string }>;
}
export class PasswordResetRequestDto {
  @ApiProperty() @Transform(trimLowercase) @IsEmail() email!: string;
  @ApiProperty({ example: '01012345678' }) @Transform(compactPhoneNumber) @IsString() @IsNotEmpty() phoneNumber!: string;
}
export class PasswordResetRequestResponseDto {}
export class EmailVerificationRequestDto {
  @ApiProperty({ example: 'operator@example.com' }) @Transform(trimLowercase) @IsEmail() email!: string;
}
export class EmailVerificationRequestResponseDto { @ApiProperty() accepted!: boolean; }
export class VerifyEmailDto { @ApiProperty() @IsString() @IsNotEmpty() challengeId!: string; @ApiProperty() @IsString() @IsNotEmpty() token!: string; }
export class VerifyEmailResponseDto { @ApiProperty() emailVerified!: boolean; }
export class VerifyPasswordResetDto { @ApiProperty() @IsString() @IsNotEmpty() challengeId!: string; @ApiProperty() @IsString() @IsNotEmpty() token!: string; }
export class ResetPasswordDto extends VerifyPasswordResetDto { @ApiProperty({ minLength: SECURITY_CONFIG.password.minLength, maxLength: SECURITY_CONFIG.password.maxLength }) @IsString() @MinLength(SECURITY_CONFIG.password.minLength) @MaxLength(SECURITY_CONFIG.password.maxLength) newPassword!: string; }
