import { ApiProperty } from '@nestjs/swagger';

import { DtoType } from '#/common/dto/entity-dto';
import { ROLE_NAMES, type RoleName } from '#/entities/auth.extentions/role.entity';
import { User } from '#/entities/auth/user.entity';

export class UserItemDto extends DtoType(User) {
  constructor(user: User) {
    super();
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.role = user.role ?? ROLE_NAMES.USER;
    this.twoFactorEnabled = user.twoFactorEnabled;
    this.banned = user.banned;
    this.banReason = user.banReason;
    this.banExpires = user.banExpires ?? null;
    this.deleted = Boolean(user.deletedAt);
    this.deletedAt = user.deletedAt ?? null;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  @ApiProperty({ example: 'usr_12345' })
  override id!: string;

  @ApiProperty({ example: 'user@example.com' })
  override email!: string;

  @ApiProperty({ example: '홍길동' })
  override name!: string;

  @ApiProperty({ enum: ROLE_NAMES, example: ROLE_NAMES.USER })
  override role!: RoleName;

  @ApiProperty({ example: false })
  override twoFactorEnabled!: boolean;

  @ApiProperty({ example: false })
  override banned!: boolean;

  @ApiProperty({ type: String, example: 'Repeated failed login attempts', nullable: true, required: false })
  override banReason!: string | null;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true, required: false })
  override banExpires!: Date | null;

  @ApiProperty({ example: false })
  deleted!: boolean;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true, required: false })
  override deletedAt!: Date | null;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt!: Date;
}
