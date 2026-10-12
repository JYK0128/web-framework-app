import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsString, MaxLength, Min, ValidateIf } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class UpdateTermGroupRequestDto extends BaseDto {
  @ApiPropertyOptional({ maxLength: 255 }) @ValidateIf((_object, value) => value !== undefined) @IsString() @IsNotEmpty() @MaxLength(255) title?: string;
  @ApiPropertyOptional() @ValidateIf((_object, value) => value !== undefined) @IsBoolean() isRequired?: boolean;
  @ApiPropertyOptional() @ValidateIf((_object, value) => value !== undefined) @IsInt() @Min(0) sortOrder?: number;
}
