import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryRequestDtoFor } from '@pkg/server-core/http/dto/request';
import { IsOptional, IsUUID } from 'class-validator';

import { UserTermAgreement } from '~/core/database/entities/terms';

const GetAgreementHistoryRequestDtoBase = QueryRequestDtoFor<UserTermAgreement>()({
  sort: { fields: ['createdAt'], default: ['createdAt'] },
  cursor: {},
});

export class GetAgreementHistoryRequestDto extends GetAgreementHistoryRequestDtoBase {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  override sort: 'createdAt'[] = ['createdAt'];
  override direction = ['desc' as const];
}
