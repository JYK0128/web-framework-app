import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryRequestDtoFor } from '@pkg/server-core/http/dto/request';
import { NoticeImportance } from '@pkg/shared/constants';
import { IsEnum, IsOptional } from 'class-validator';

import type { BaseEntity } from '~/core/database/entities/base.entity';

const GetNoticesRequestDtoBase = QueryRequestDtoFor<BaseEntity>()({
  search: { fields: [] },
  sort: { fields: ['createdAt', 'publishedAt'], default: ['createdAt'] },
  page: {},
});

export class GetNoticesRequestDto extends GetNoticesRequestDtoBase {
  @ApiPropertyOptional({ enum: NoticeImportance }) @IsOptional() @IsEnum(NoticeImportance) importance?: NoticeImportance;
  override sort: ('createdAt' | 'publishedAt')[] = ['createdAt'];
}
