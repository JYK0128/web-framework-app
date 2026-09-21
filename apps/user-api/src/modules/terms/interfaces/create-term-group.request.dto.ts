import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateTermGroupRequestDto {
  @ApiProperty({ maxLength: 50 }) @IsString() @IsNotEmpty() @MaxLength(50) code!: string;
  @ApiProperty({ maxLength: 255 }) @IsString() @IsNotEmpty() @MaxLength(255) title!: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isRequired?: boolean;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}
