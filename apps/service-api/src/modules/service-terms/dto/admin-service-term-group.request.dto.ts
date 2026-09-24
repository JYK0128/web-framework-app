import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class AdminServiceTermGroupRequestDto {
  @ApiProperty({ maxLength: 255 }) @IsString() @IsNotEmpty() @MaxLength(255) title!: string;
  @ApiPropertyOptional({ type: Boolean, default: true }) @IsOptional() @IsBoolean() isRequired = true;
  @ApiPropertyOptional({ type: Number, default: 0, maximum: 999999 }) @IsOptional() @IsInt() @Min(0) @Max(999999) sortOrder = 0;
}
