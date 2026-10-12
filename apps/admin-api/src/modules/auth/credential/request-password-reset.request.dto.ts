import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { normalizePhoneNumber } from '@pkg/shared/common';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { ToLowerCase } from '#/core/http/decorators/to-lower-case.decorator';
import { BaseDto } from '#/core/http/dto/base/base.dto';

@ApiSchema({ name: 'PasswordResetRequestDto' })
export class RequestPasswordResetRequestDto extends BaseDto {
  @ApiProperty() @ToLowerCase() @IsEmail() email!: string;
  @ApiProperty({ example: '01012345678' }) @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? normalizePhoneNumber(value) : value) @IsString() @IsNotEmpty() phoneNumber!: string;
}
