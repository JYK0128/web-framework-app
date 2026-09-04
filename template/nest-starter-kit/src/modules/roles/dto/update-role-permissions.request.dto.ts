import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Role, type RolePermissions } from '#/entities/auth.extentions/role.entity';

export class UpdateRolePermissionsRequestDto extends DtoType(Role) {
  @ApiPropertyOptional({ type: 'string', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  override label?: string;

  @ApiPropertyOptional({ type: 'string', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  override description?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } })
  @IsOptional()
  @IsObject()
  override permissions?: RolePermissions;
}
