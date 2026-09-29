import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { maskEmail, maskName } from '@pkg/shared/common';
import { decrypt } from '@pkg/shared/server';

import { EntityResponseDto } from '#/common/interfaces/base';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';

@ApiSchema({ name: 'OperatorItem' })
export class OperatorItemDto extends EntityResponseDto(User) {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ description: '할당된 역할 코드' })
  roleCode!: string;

  @ApiProperty({ description: '할당된 역할 표시명' })
  roleLabel!: string;

  @ApiProperty()
  twoFactorEnabled!: boolean;

  @ApiProperty()
  banned!: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  banReason!: string | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  banExpires!: Date | null;

  @ApiProperty()
  deleted!: boolean;

  @ApiPropertyOptional({ type: Date, nullable: true })
  deletedAt!: Date | null;

  @ApiProperty({ type: Date })
  createdAt!: Date;

  @ApiProperty({ type: Date })
  updatedAt!: Date;

  static override from(operator: User): OperatorItemDto {
    return OperatorItemDto.fromPlain({
      id: operator.id,
      name: maskName(operator.name),
      email: maskEmail(decrypt(operator.emailEncrypted, env.PII_ENCRYPTION_KEY)),
      roleCode: operator.role?.code ?? '',
      roleLabel: operator.role?.label ?? '',
      twoFactorEnabled: operator.twoFactorEnabled,
      banned: operator.isBanned,
      banReason: operator.banReason ?? null,
      banExpires: operator.banExpires ?? null,
      deleted: Boolean(operator.deletedAt),
      deletedAt: operator.deletedAt ?? null,
      createdAt: operator.createdAt,
      updatedAt: operator.updatedAt,
    });
  }
}
