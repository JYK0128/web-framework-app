import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { Role } from '#/core/database/entities/auth.extensions/role.entity';
import { EntityDto } from '#/core/http/dto/base/entity.dto';

export class CreateRoleRequestDto extends EntityDto(Role) {
  @ApiProperty({ example: 'content_manager' }) @IsString() @MinLength(1) @MaxLength(50) code!: string;
  @ApiProperty({ example: '콘텐츠 운영자' }) @IsString() @MinLength(1) @MaxLength(100) label!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) description?: string;
  @ApiPropertyOptional({ type: [String], default: [] }) @IsOptional() @IsArray() @IsString({ each: true }) permissions?: string[];
}
