import type { EntityDTO } from '@mikro-orm/core';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { differenceInDays, isAfter } from 'date-fns';

import { PASSWORD_EXPIRATION_DAYS } from '#/common/configs/app.config';
import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { RoleKey, type RolePermissions } from '#/entities/auth.extentions/role.entity';
import { AccountMetadata } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';

@ApiSchema({ name: 'UserProfileResponse' })
export class UserProfileResponseDto extends DtoType(User) {
  constructor(
    user: User | EntityDTO<User>,
    accountMetadata?: AccountMetadata | null,
    permissions: RolePermissions = {},
    expirationDays = PASSWORD_EXPIRATION_DAYS,
  ) {
    super();
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.emailVerified = user.emailVerified;
    this.phoneNumber = user.phoneNumber;
    this.phoneNumberVerified = user.phoneNumberVerified;
    this.role = user.role ?? null;
    this.permissions = permissions;
    this.image = user.image;
    this.twoFactorEnabled = user.twoFactorEnabled;
    this.banned = Boolean(user.banExpires && isAfter(user.banExpires, new Date()));
    this.banReason = user.banReason;
    this.banExpires = user.banExpires;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.passwordUpdatedAt = accountMetadata?.passwordUpdatedAt ?? null;
    const now = new Date();
    const deferredUntil = accountMetadata?.passwordChangeDeferredUntil;
    const isDeferred = Boolean(deferredUntil && isAfter(deferredUntil, now));
    const baseDate = accountMetadata?.passwordUpdatedAt ?? user.createdAt;
    const diffDays = baseDate ? differenceInDays(now, baseDate) : 0;
    this.isPasswordChangeRequired = Boolean(accountMetadata?.passwordResetRequired) || (!isDeferred && expirationDays > 0 && diffDays >= expirationDays);
  }

  @ApiProperty({ type: 'string', format: 'uuid' })
  override id!: string;

  @ApiProperty({ type: 'string', maxLength: 120 })
  override name!: string;

  @ApiProperty({ type: 'string', format: 'email' })
  override email!: string;

  @ApiProperty({ type: 'boolean' })
  override emailVerified!: boolean;

  @ApiProperty({ type: 'string', nullable: true })
  override phoneNumber!: string | null;

  @ApiProperty({ type: 'boolean' })
  override phoneNumberVerified!: boolean;

  @ApiProperty({ type: 'string', nullable: true })
  override image!: string | null;

  @ApiProperty({ type: 'boolean' })
  override twoFactorEnabled!: boolean;

  @ApiProperty({ type: 'boolean' })
  override banned!: boolean;

  @ApiProperty({ type: 'string', nullable: true })
  override banReason!: string | null;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override banExpires!: Date | null;

  @ApiEnum({ enum: RoleKey, nullable: true })
  override role!: RoleKey | null;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } })
  permissions!: RolePermissions;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  passwordUpdatedAt!: Date | null;

  @ApiProperty({ type: 'boolean' })
  isPasswordChangeRequired!: boolean;
}
