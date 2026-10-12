import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class UpdateMembershipRequestDto extends BaseDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) @MaxLength(100) label?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) description?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsString({ each: true }) permissions?: string[];
}
