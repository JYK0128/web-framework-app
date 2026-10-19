import { ApiPropertyOptional } from '@nestjs/swagger';
import { EntityDto } from '@pkg/server-core/http/dto/base/entity.dto';
import { IsArray, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

import { Role } from '#/core/database/entities/auth.extensions';

export class UpdateRoleRequestDto extends EntityDto(Role) {
  @ApiPropertyOptional() @ValidateIf((_object, value) => value !== undefined) @IsString() @MinLength(1) @MaxLength(100) label?: string;
  @ApiPropertyOptional() @ValidateIf((_object, value) => value !== undefined) @IsString() @MaxLength(255) description?: string;
  @ApiPropertyOptional({ type: [String] }) @ValidateIf((_object, value) => value !== undefined) @IsArray() @IsString({ each: true }) permissions?: string[];
}
