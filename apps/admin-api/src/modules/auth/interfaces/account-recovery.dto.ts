import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

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
export class VerifyPasswordResetDto { @ApiProperty() @IsString() @IsNotEmpty() challengeId!: string; @ApiProperty() @IsString() @IsNotEmpty() token!: string; }
export class ResetPasswordDto extends VerifyPasswordResetDto { @ApiProperty({ minLength: 8 }) @IsString() @MinLength(8) newPassword!: string; }
export class VerifyPasswordResetResponseDto { @ApiProperty() isValid!: boolean; }
