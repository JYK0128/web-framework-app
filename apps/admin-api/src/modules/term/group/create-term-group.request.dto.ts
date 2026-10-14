import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { IsBoolean, IsInt, IsNotEmpty, IsString, MaxLength, Min, ValidateIf } from 'class-validator';

export class CreateTermGroupRequestDto extends BaseDto {
  @ApiProperty({ maxLength: 255 }) @IsString() @IsNotEmpty() @MaxLength(255) title!: string;
  @ApiPropertyOptional({ default: true }) @ValidateIf((_object, value) => value !== undefined) @IsBoolean() isRequired?: boolean;
  @ApiPropertyOptional({ default: 0 }) @ValidateIf((_object, value) => value !== undefined) @IsInt() @Min(0) sortOrder?: number;
}
