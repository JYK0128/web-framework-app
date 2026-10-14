import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { EntityResponseDto } from '@pkg/server-core/http/dto/response/entity.response.dto';
import { IsBoolean, IsInt, IsString, Max, Min } from 'class-validator';

import { SystemConfig } from '#/core/database/entities/system-configs';
import { AdminEmailConfigDto } from '#/modules/system-config/admin-email/admin-email-config.dto';

export class AdminEmailConfigResponseDto extends EntityResponseDto(SystemConfig) {
  protected static override readonly validationError = {
    code: 'ACCOUNT_RECOVERY_EMAIL_CONFIG_INVALID',
    status: HttpStatus.SERVICE_UNAVAILABLE,
  };

  @ApiProperty() @IsString() smtpHost!: string;
  @ApiProperty({ minimum: 1, maximum: 65535 }) @IsInt() @Min(1) @Max(65535) smtpPort!: number;
  @ApiProperty() @IsBoolean() smtpSecure!: boolean;
  @ApiProperty() @IsString() smtpUser!: string;
  @ApiProperty() @IsBoolean() smtpPasswordConfigured!: boolean;
  @ApiProperty() @IsString() from!: string;

  static override parseEntity(entity: SystemConfig): AdminEmailConfigResponseDto {
    return this.parseValue(entity.value);
  }

  static parseValue(value: unknown): AdminEmailConfigResponseDto {
    const config = AdminEmailConfigDto.parse(value);
    return this.parse({
      from: config.from,
      smtpHost: config.smtp.host,
      smtpPort: config.smtp.port,
      smtpSecure: config.smtp.secure,
      smtpUser: config.smtp.user,
      smtpPasswordConfigured: config.smtp.pass.length > 0,
    });
  }
}
