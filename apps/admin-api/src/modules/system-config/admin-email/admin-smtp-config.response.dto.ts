import { HttpStatus } from '@nestjs/common';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import type { EmailConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { IsDefined, IsEmail, ValidateNested } from 'class-validator';

import { AdminEmailConfigSmtpDto } from '#/modules/system-config/admin-email/admin-email-config.dto';

/** 메일 발송기에 전달하는 내부 설정. SMTP 비밀번호는 복호화된 값입니다. */
export class AdminSmtpConfigResponseDto extends BaseDto implements EmailConfigDto {
  protected static override readonly validationError = {
    code: 'ACCOUNT_RECOVERY_EMAIL_CONFIG_INVALID',
    status: HttpStatus.SERVICE_UNAVAILABLE,
  };

  @IsEmail()
  from!: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => AdminEmailConfigSmtpDto)
  smtp!: AdminEmailConfigSmtpDto;
}
