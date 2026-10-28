import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryRequestDtoFor } from '@pkg/server-core/http/dto/request';
import { NoticeImportance } from '@pkg/shared/constants';
import { IsEnum, IsOptional } from 'class-validator';

import { Notice } from '~/core/database/entities/notices';

const GetNoticesRequestDtoBase = QueryRequestDtoFor<Notice>()({
  search: { fields: ['title', 'content'] },
  sort: { fields: ['createdAt', 'publishedAt'], default: ['createdAt'] },
  page: {},
});

export class GetNoticesRequestDto extends GetNoticesRequestDtoBase {
  @ApiPropertyOptional({ enum: NoticeImportance }) @IsOptional() @IsEnum(NoticeImportance) importance?: NoticeImportance;

  override sort: ('createdAt' | 'publishedAt')[] = ['createdAt'];
  override toQuery() {
    const query = super.toQuery();
    const filters = [query.where, ...(this.importance ? [{ importance: this.importance }] : [])];
    return { ...query, where: { $and: filters } };
  }
}
