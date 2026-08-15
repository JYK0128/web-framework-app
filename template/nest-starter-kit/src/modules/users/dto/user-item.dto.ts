import { ApiProperty } from '@nestjs/swagger';

import { ROLE_NAMES } from '#/entities/auth.extentions/role.entity';
import type { User } from '#/entities/auth/user.entity';

export class UserItemDto {
  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.role = user.role ?? ROLE_NAMES.USER;
    this.twoFactorEnabled = user.twoFactorEnabled;
    this.banned = user.banned;
    this.banReason = user.banReason;
    this.banExpires = user.banExpires?.toISOString() ?? null;
    this.deleted = Boolean(user.deletedAt);
    this.deletedAt = user.deletedAt?.toISOString() ?? null;
    this.createdAt = user.createdAt.toISOString();
    this.updatedAt = user.updatedAt.toISOString();
  }

  @ApiProperty({ example: 'usr_12345' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: '홍길동' })
  name!: string;

  @ApiProperty({ example: 'user' })
  role!: string;

  @ApiProperty({ example: false })
  twoFactorEnabled!: boolean;

  @ApiProperty({ example: false })
  banned!: boolean;

  @ApiProperty({ type: String, example: 'Repeated failed login attempts', nullable: true, required: false })
  banReason!: string | null;

  @ApiProperty({ type: String, example: '2026-08-20T00:00:00.000Z', format: 'date-time', nullable: true, required: false })
  banExpires!: string | null;

  @ApiProperty({ example: false })
  deleted!: boolean;

  @ApiProperty({ type: String, example: null, format: 'date-time', nullable: true, required: false })
  deletedAt!: string | null;

  @ApiProperty({ example: '2026-08-12T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-12T00:00:00.000Z' })
  updatedAt!: string;
}
