import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateAdminEmailConfigRequestDto extends BaseDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255) smtpHost!: string;
  @ApiProperty({ minimum: 1, maximum: 65535 }) @IsInt() @Min(1) @Max(65535) smtpPort!: number;
  @ApiProperty() @IsBoolean() smtpSecure!: boolean;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255) smtpUser!: string;
  @ApiPropertyOptional({ description: '비워두면 기존 비밀번호를 유지합니다.' }) @IsOptional() @IsString() @MaxLength(500) smtpPassword?: string;
  @ApiProperty() @IsEmail() @MaxLength(255) from!: string;
}
