import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { EntityDto } from '#/common/interfaces/base';
import { Role } from '#/entities/auth.extensions/role.entity';

export class CreateRoleRequestDto extends EntityDto(Role) {
  @ApiProperty({ example: 'content_manager' }) @IsString() @MinLength(1) @MaxLength(50) code!: string;
  @ApiProperty({ example: '콘텐츠 관리자' }) @IsString() @MinLength(1) @MaxLength(100) label!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) description?: string;
  @ApiPropertyOptional({ type: [String], default: [] }) @IsOptional() @IsArray() @IsString({ each: true }) permissions?: string[];
}
