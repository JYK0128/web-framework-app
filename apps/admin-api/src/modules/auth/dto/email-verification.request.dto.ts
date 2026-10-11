import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { trimLowercase } from '#/modules/auth/dto/account-recovery.transforms';

export class EmailVerificationRequestDto extends BaseDto {
  @ApiProperty({ example: 'operator@example.com' }) @Transform(trimLowercase) @IsEmail() email!: string;
}
