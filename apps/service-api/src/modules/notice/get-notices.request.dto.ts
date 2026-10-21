import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageRequestDto } from '@pkg/server-core/http/dto/request';
import { NoticeImportance } from '@pkg/shared/constants';
import { IsEnum, IsOptional } from 'class-validator';

import { Notice } from '~/core/database/entities/notices';

export class GetNoticesRequestDto extends PageRequestDto<Notice, 'createdAt' | 'publishedAt'> {
  @ApiPropertyOptional({ enum: NoticeImportance }) @IsOptional() @IsEnum(NoticeImportance) importance?: NoticeImportance;
  override get searchFields(): (keyof Notice)[] { return ['title', 'content']; }
  override sort: ('createdAt' | 'publishedAt')[] = ['createdAt'];
  override toFilterQuery() {
    const query = super.toFilterQuery();
    const filters = [query, ...(this.importance ? [{ importance: this.importance }] : [])];
    return { $and: filters };
  }
}
