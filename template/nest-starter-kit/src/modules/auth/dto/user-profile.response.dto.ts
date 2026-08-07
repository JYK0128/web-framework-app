import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { DtoType } from '#/common/dto/entity-dto';
import { AccountMetadata } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';

@ApiSchema({ name: 'UserProfileResponse' })
export class UserProfileResponseDto extends DtoType(User, [
  'id',
  'name',
  'email',
  'emailVerified',
  'isAnonymous',
  'image',
  'twoFactorEnabled',
  'createdAt',
  'updatedAt',
] as const) {
  constructor(user: User, accountMetadata?: AccountMetadata | null) {
    super();
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.emailVerified = user.emailVerified;
    this.isAnonymous = user.isAnonymous;
    this.image = user.image;
    this.twoFactorEnabled = user.twoFactorEnabled;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.passwordUpdatedAt = accountMetadata?.passwordUpdatedAt ?? null;

    const now = new Date();
    const deferredUntil = accountMetadata?.passwordChangeDeferredUntil;
    const isDeferred = Boolean(deferredUntil && deferredUntil > now);
    const targetDate = accountMetadata?.passwordUpdatedAt ?? user.createdAt;
    const diffDays = targetDate ? (now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24) : 0;
    this.isPasswordChangeRequired = !isDeferred && diffDays >= env.PASSWORD_EXPIRATION_DAYS;
  }

  @ApiProperty({ format: 'uuid' })
  override id!: string;

  @ApiProperty({ maxLength: 120 })
  override name!: string;

  @ApiProperty({ format: 'email' })
  override email!: string;

  @ApiProperty()
  override emailVerified!: boolean;

  @ApiProperty()
  override isAnonymous!: boolean;

  @ApiProperty({ type: String, nullable: true, required: false })
  override image!: string | null;

  @ApiProperty()
  override twoFactorEnabled!: boolean;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true, required: false })
  passwordUpdatedAt?: Date | null;

  @ApiProperty()
  isPasswordChangeRequired!: boolean;
}
