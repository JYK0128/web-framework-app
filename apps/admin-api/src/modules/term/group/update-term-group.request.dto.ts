import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { IsBoolean, IsInt, IsNotEmpty, IsString, MaxLength, Min, ValidateIf } from 'class-validator';

export class UpdateTermGroupRequestDto extends BaseDto {
  @ApiPropertyOptional({ maxLength: 255 }) @ValidateIf((_object, value) => value !== undefined) @IsString() @IsNotEmpty() @MaxLength(255) title?: string;
  @ApiPropertyOptional() @ValidateIf((_object, value) => value !== undefined) @IsBoolean() isRequired?: boolean;
  @ApiPropertyOptional() @ValidateIf((_object, value) => value !== undefined) @IsInt() @Min(0) sortOrder?: number;
}
