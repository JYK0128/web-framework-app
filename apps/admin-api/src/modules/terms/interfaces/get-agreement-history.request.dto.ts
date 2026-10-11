import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

import { UserTermAgreement } from '#/core/database/entities/terms/user-term-agreement.entity';
import { CursorRequestDto } from '#/core/http/dto';

export class GetAgreementHistoryRequestDto extends CursorRequestDto<UserTermAgreement, 'createdAt'> {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  override sort: 'createdAt'[] = ['createdAt'];
  override direction = ['desc' as const];
}
