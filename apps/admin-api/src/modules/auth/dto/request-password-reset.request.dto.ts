import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { compactPhoneNumber, trimLowercase } from '#/modules/auth/dto/account-recovery.transforms';

@ApiSchema({ name: 'PasswordResetRequestDto' })
export class RequestPasswordResetRequestDto extends BaseDto {
  @ApiProperty() @Transform(trimLowercase) @IsEmail() email!: string;
  @ApiProperty({ example: '01012345678' }) @Transform(compactPhoneNumber) @IsString() @IsNotEmpty() phoneNumber!: string;
}
