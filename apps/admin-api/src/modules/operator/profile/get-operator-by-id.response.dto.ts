import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

import { Account, User } from '~/core/database/entities/auth';
import { OperatorItemDto } from '~/modules/operator/profile/operator-item.dto';

@ApiSchema({ name: 'OperatorDetailResponse' })
export class GetOperatorByIdResponseDto extends OperatorItemDto {
  @ApiProperty({ type: [String] })
  providers!: string[];

  @ApiPropertyOptional({ type: Date, nullable: true })
  passwordUpdatedAt!: Date | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  lastLoginAt!: Date | null;

  static override parseEntity(operator: User, accounts?: Account[]): GetOperatorByIdResponseDto {
    if (!accounts) throw new Error('GetOperatorByIdResponseDto.parseEntity requires accounts');
    const passwordAccount = accounts.find((account) => account.providerId === Account.PROVIDER_CREDENTIAL);
    return this.parse({
      ...OperatorItemDto.parseEntity(operator),
      providers: [...new Set(accounts.map((account) => account.providerId))],
      passwordUpdatedAt: passwordAccount?.metadata?.passwordUpdatedAt ?? null,
      lastLoginAt: operator.metadata?.lastLoginAt ? new Date(operator.metadata.lastLoginAt) : null,
    });
  }
}
