import { ApiPropertyOptional } from '@nestjs/swagger';
import { CursorRequestDto } from '@pkg/server-core/http/dto/request';
import { IsOptional, IsUUID } from 'class-validator';

import { UserTermAgreement } from '~/core/database/entities/terms';

export class GetAgreementHistoryRequestDto extends CursorRequestDto<UserTermAgreement, 'createdAt'> {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  override sort: 'createdAt'[] = ['createdAt'];
  override direction = ['desc' as const];
}
