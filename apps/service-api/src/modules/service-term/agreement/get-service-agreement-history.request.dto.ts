import { ApiProperty } from '@nestjs/swagger';
import { CursorRequestDto } from '@pkg/server-core/http/dto';
import { IsIn, IsUUID } from 'class-validator';

import { UserTermAgreement } from '#/core/database/entities/terms';

export class GetServiceAgreementHistoryRequestDto extends CursorRequestDto<UserTermAgreement, 'createdAt' | 'id'> {
  @ApiProperty({ format: 'uuid' }) @IsUUID() groupId!: string;
  @IsIn(['createdAt', 'id'], { each: true })
  override sort: ('createdAt' | 'id')[] = ['createdAt', 'id'];

  override direction = ['desc' as const, 'desc' as const];
}
