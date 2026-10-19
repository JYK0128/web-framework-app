import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { normalizePhoneNumber } from '@pkg/shared/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class FindIdRequestDto extends BaseDto {
  @ApiProperty({ example: 'Super Admin' }) @IsString() @IsNotEmpty() name!: string;
  @ApiProperty({ example: '01012345678' }) @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? normalizePhoneNumber(value) : value) @IsString() @IsNotEmpty() phoneNumber!: string;
}
