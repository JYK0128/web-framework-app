import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';

import { CursorRequestDto } from '#/common/interfaces';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';

export class GetServiceAgreementHistoryRequestDto extends CursorRequestDto<UserTermAgreement, 'createdAt' | 'id'> {
  @ApiProperty({ format: 'uuid' }) @IsUUID() groupId!: string;
  @IsIn(['createdAt', 'id'], { each: true })
  override sort: ('createdAt' | 'id')[] = ['createdAt', 'id'];

  override direction = ['desc' as const, 'desc' as const];
}
