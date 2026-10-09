import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

import { CursorRequestDto } from '#/common/interfaces';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';

export class GetAgreementHistoryRequestDto extends CursorRequestDto<UserTermAgreement, 'createdAt'> {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  override sort: 'createdAt'[] = ['createdAt'];
  override direction = ['desc' as const];
}
