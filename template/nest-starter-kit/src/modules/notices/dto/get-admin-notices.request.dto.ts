import { raw } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { PageRequestDto, type SortDirection } from '#/common/interfaces';
import { Notice } from '#/entities/notices/notice.entity';

export const NOTICE_ADMIN_SORT = ['title', 'status', 'priority', 'publishedAt', 'expiresAt', 'createdAt', 'updatedAt', 'id'] as const;
export type NoticeAdminSortKey = (typeof NOTICE_ADMIN_SORT)[number];

export class GetAdminNoticesRequestDto extends PageRequestDto<Notice> {
  @ApiPropertyOptional({ isArray: true, enum: NOTICE_ADMIN_SORT })
  @IsIn(NOTICE_ADMIN_SORT, { each: true })
  override sort: NoticeAdminSortKey[] = ['createdAt'];

  override get searchFields(): (keyof Notice)[] {
    return ['title', 'content'];
  }

  protected override toOrderBy(): Record<string, SortDirection> {
    const orderBy = super.toOrderBy();
    if (!orderBy.status) return orderBy;

    const direction = orderBy.status;
    delete orderBy.status;
    return {
      ...orderBy,
      [raw((alias) => `case when ${alias}."publishedAt" is null then 0 when ${alias}."publishedAt" > now() then 1 when ${alias}."expiresAt" is not null and ${alias}."expiresAt" <= now() then 3 else 2 end`)]: direction,
    };
  }
}
