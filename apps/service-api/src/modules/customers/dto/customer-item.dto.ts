import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';
import { decrypt } from '@pkg/shared/server';

import { EntityDto } from '#/common/interfaces/base/entity.dto';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';

@ApiSchema({ name: 'CustomerItem' })
export class CustomerItemDto extends EntityDto(User) {
  @ApiProperty({ type: String })
  override id!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: String })
  email!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  image?: string | null;

  @ApiProperty({ type: Boolean })
  override emailVerified!: boolean;

  @ApiProperty({ type: Boolean })
  override banned!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  override updatedAt!: Date;

  @ApiPropertyOptional({ type: String, nullable: true })
  roleCode?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  roleLabel?: string | null;

  static override from(user: User): CustomerItemDto {
    if (!user.profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
    return this.fromPlain({
      id: user.id,
      name: user.profile.name,
      email: decrypt(user.profile.emailEncrypted, env.PII_ENCRYPTION_KEY),
      image: user.profile.image,
      emailVerified: user.emailVerified,
      banned: user.banned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roleCode: user.role?.code ?? null,
      roleLabel: user.role?.label ?? null,
    });
  }
}
