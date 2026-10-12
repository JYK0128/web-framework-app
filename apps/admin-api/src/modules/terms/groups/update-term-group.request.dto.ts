import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class UpdateTermGroupRequestDto extends BaseDto {
  @ApiPropertyOptional({ maxLength: 255 }) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(255) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isRequired?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}
