import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { compactPhoneNumber } from '#/modules/auth/dto/account-recovery.transforms';

export class FindIdRequestDto extends BaseDto {
  @ApiProperty({ example: 'Super Admin' }) @IsString() @IsNotEmpty() name!: string;
  @ApiProperty({ example: '01012345678' }) @Transform(compactPhoneNumber) @IsString() @IsNotEmpty() phoneNumber!: string;
}
