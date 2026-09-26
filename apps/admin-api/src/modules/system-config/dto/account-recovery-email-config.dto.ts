import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class AccountRecoveryEmailConfigResponseDto {
  @ApiProperty() smtpHost!: string;
  @ApiProperty({ minimum: 1, maximum: 65535 }) smtpPort!: number;
  @ApiProperty() smtpSecure!: boolean;
  @ApiProperty() smtpUser!: string;
  @ApiProperty() smtpPasswordConfigured!: boolean;
  @ApiProperty() from!: string;
}

export class UpdateAccountRecoveryEmailConfigRequestDto {
  @ApiProperty() @IsString() @MaxLength(255) smtpHost!: string;
  @ApiProperty({ minimum: 1, maximum: 65535 }) @IsInt() @Min(1) @Max(65535) smtpPort!: number;
  @ApiProperty() @IsBoolean() smtpSecure!: boolean;
  @ApiProperty() @IsString() @MaxLength(255) smtpUser!: string;
  @ApiPropertyOptional({ description: '비워두면 기존 비밀번호를 유지합니다.' }) @IsOptional() @IsString() @MaxLength(500) smtpPassword?: string;
  @ApiProperty() @IsString() @MaxLength(255) from!: string;
}

export class TestAccountRecoveryEmailRequestDto {
  @ApiProperty({ example: 'operator@example.com' })
  @IsEmail()
  to!: string;
}

export class TestAccountRecoveryEmailResponseDto {
  @ApiProperty() sent!: boolean;
  @ApiProperty() message!: string;
}
