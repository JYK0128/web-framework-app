import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryRequestDtoFor } from '@pkg/server-core/http/dto/request';
import { QnaPriority, QnaStatus } from '@pkg/shared/constants';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import type { BaseEntity } from '~/core/database/entities/base.entity';

const GetQnasRequestDtoBase = QueryRequestDtoFor<BaseEntity>()({
  search: { fields: [] },
  sort: { fields: ['createdAt', 'updatedAt'], default: ['createdAt'] },
  page: {},
});

export class GetQnasRequestDto extends GetQnasRequestDtoBase {
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'updatedAt'] })
  @IsIn(['createdAt', 'updatedAt'], { each: true })
  override sort: ('createdAt' | 'updatedAt')[] = ['createdAt'];

  @ApiPropertyOptional({ enum: QnaStatus }) @IsOptional() @IsEnum(QnaStatus) status?: QnaStatus;
  @ApiPropertyOptional({ enum: QnaPriority }) @IsOptional() @IsEnum(QnaPriority) priority?: QnaPriority;
}
