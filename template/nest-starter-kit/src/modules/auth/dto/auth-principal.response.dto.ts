import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import type { AuthPrincipal } from 'express-session';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { RoleName, type RolePermissions } from '#/entities/auth.extentions/role.entity';

@ApiSchema({ name: 'AuthPrincipalResponse' })
export class AuthPrincipalResponseDto implements AuthPrincipal {
  @ApiProperty({ type: 'string', format: 'uuid' })
  id!: string;

  @ApiProperty({ type: 'string', maxLength: 120 })
  name!: string;

  @ApiProperty({ type: 'string', format: 'email' })
  email!: string;

  @ApiProperty({ type: 'boolean' })
  emailVerified!: boolean;

  @ApiEnum({ enum: RoleName, nullable: true })
  role!: RoleName | null;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } })
  permissions!: RolePermissions;

  @ApiProperty({ type: 'boolean' })
  requiredTermsAgreed!: boolean;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  passwordUpdatedAt!: Date | null;

  @ApiProperty({ type: 'boolean' })
  isPasswordChangeRequired!: boolean;
}
