import type { EntityDTO } from '@mikro-orm/core';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { differenceInDays, isAfter } from 'date-fns';

import { DtoType } from '#/common/dto/entity-dto';
import { ROLE_NAMES, type RoleName, type RolePermissions } from '#/entities/auth.extentions/role.entity';
import { AccountMetadata } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { PASSWORD_EXPIRATION_DAYS } from '#/modules/auth/constants/auth-policy.constants';

@ApiSchema({ name: 'UserProfileResponse' })
export class UserProfileResponseDto extends DtoType(User) {
  constructor(
    user: User | EntityDTO<User>,
    accountMetadata?: AccountMetadata | null,
    permissions: RolePermissions = {},
  ) {
    super();
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.emailVerified = user.emailVerified;
    this.role = user.role ?? null;
    this.permissions = permissions;
    this.image = user.image;
    this.twoFactorEnabled = user.twoFactorEnabled;
    this.banned = user.banned;
    this.banReason = user.banReason;
    this.banExpires = user.banExpires;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.passwordUpdatedAt = accountMetadata?.passwordUpdatedAt ?? null;

    const now = new Date();
    const deferredUntil = accountMetadata?.passwordChangeDeferredUntil;
    const isDeferred = Boolean(deferredUntil && isAfter(deferredUntil, now));
    const targetDate = accountMetadata?.passwordUpdatedAt ?? user.createdAt;
    const diffDays = targetDate ? differenceInDays(now, targetDate) : 0;
    this.isPasswordChangeRequired = Boolean(accountMetadata?.passwordResetRequired) || (!isDeferred && diffDays >= PASSWORD_EXPIRATION_DAYS);
  }

  @ApiProperty({ format: 'uuid' })
  override id!: string;

  @ApiProperty({ maxLength: 120 })
  override name!: string;

  @ApiProperty({ format: 'email' })
  override email!: string;

  @ApiProperty()
  override emailVerified!: boolean;

  @ApiProperty({ type: String, nullable: true, required: false })
  override image!: string | null;

  @ApiProperty()
  override twoFactorEnabled!: boolean;

  @ApiProperty()
  override banned!: boolean;

  @ApiProperty({ type: String, nullable: true, required: false })
  override banReason!: string | null;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true, required: false })
  override banExpires!: Date | null;

  @ApiProperty({ enum: ROLE_NAMES, nullable: true })
  override role!: RoleName | null;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } })
  permissions!: RolePermissions;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true, required: false })
  passwordUpdatedAt?: Date | null;

  @ApiProperty()
  isPasswordChangeRequired!: boolean;
}
