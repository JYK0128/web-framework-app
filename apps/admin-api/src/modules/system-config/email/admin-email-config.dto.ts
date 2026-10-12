import { HttpStatus } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsBoolean, IsDefined, isEmail, IsInt, IsString, Max, Min, ValidateNested } from 'class-validator';

import { SystemConfig } from '#/core/database/entities/system-configs';
import { BaseDto } from '#/core/http/dto/base/base.dto';
import { EntityDto } from '#/core/http/dto/base/entity.dto';

export class AdminEmailConfigSmtpDto extends BaseDto {
  @IsString() host!: string;
  @IsInt() @Min(1) @Max(65535) port!: number;
  @IsBoolean() secure!: boolean;
  @IsString() user!: string;
  @IsString() pass!: string;
}

export class AdminEmailConfigDto extends EntityDto(SystemConfig) {
  protected static override readonly validationError = {
    code: 'ACCOUNT_RECOVERY_EMAIL_CONFIG_INVALID',
    status: HttpStatus.SERVICE_UNAVAILABLE,
  };

  @IsString() from!: string;
  @IsDefined() @ValidateNested() @Type(() => AdminEmailConfigSmtpDto) smtp!: AdminEmailConfigSmtpDto;

  static override parseEntity(entity: SystemConfig): AdminEmailConfigDto {
    return this.parse(entity.value).validate();
  }

  isConfigured(): boolean {
    return Boolean(this.smtp.host.trim() && this.smtp.user.trim() && this.smtp.pass && isEmail(this.from));
  }
}
