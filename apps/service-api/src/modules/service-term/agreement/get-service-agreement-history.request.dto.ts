import { ApiProperty } from '@nestjs/swagger';
import { QueryRequestDtoFor } from '@pkg/server-core/http/dto';
import { IsIn, IsUUID } from 'class-validator';

import { UserTermAgreement } from '~/core/database/entities/terms';

const GetServiceAgreementHistoryRequestDtoBase = QueryRequestDtoFor<UserTermAgreement>()({
  sort: { fields: ['createdAt', 'id'], default: ['createdAt', 'id'] },
  cursor: {},
});

export class GetServiceAgreementHistoryRequestDto extends GetServiceAgreementHistoryRequestDtoBase {
  @ApiProperty({ format: 'uuid' }) @IsUUID() groupId!: string;
  @IsIn(['createdAt', 'id'], { each: true })
  override sort: ('createdAt' | 'id')[] = ['createdAt', 'id'];

  override direction = ['desc' as const, 'desc' as const];
}
