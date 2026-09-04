import { ApiProperty } from '@nestjs/swagger';
import { isAfter } from 'date-fns';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { RoleKey } from '#/entities/auth.extentions/role.entity';
import { User } from '#/entities/auth/user.entity';

export class UserItemDto extends DtoType(User) {
  constructor(user: User) {
    super();
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.role = user.role ?? RoleKey.USER;
    this.twoFactorEnabled = user.twoFactorEnabled;
    this.banned = Boolean(user.banExpires && isAfter(user.banExpires, new Date()));
    this.banReason = user.banReason;
    this.banExpires = user.banExpires ?? null;
    this.deleted = Boolean(user.deletedAt);
    this.deletedAt = user.deletedAt ?? null;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string' })
  override email!: string;

  @ApiProperty({ type: 'string' })
  override name!: string;

  @ApiEnum({ enum: RoleKey })
  override role!: RoleKey;

  @ApiProperty({ type: 'boolean' })
  override twoFactorEnabled!: boolean;

  @ApiProperty({ type: 'boolean' })
  override banned!: boolean;

  @ApiProperty({ type: 'string', nullable: true })
  override banReason!: string | null;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override banExpires!: Date | null;

  @ApiProperty({ type: 'boolean' })
  deleted!: boolean;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override deletedAt!: Date | null;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt!: Date;
}
