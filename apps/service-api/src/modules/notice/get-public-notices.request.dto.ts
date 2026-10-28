import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryRequestDtoFor } from '@pkg/server-core/http/dto/request';
import { NoticeImportance } from '@pkg/shared/constants';
import { IsEnum, IsOptional } from 'class-validator';

import { Notice } from '~/core/database/entities/notices';

const GetPublicNoticesRequestDtoBase = QueryRequestDtoFor<Notice>()({
  search: { fields: ['title', 'content'] },
  sort: { fields: ['createdAt'], default: ['createdAt'] },
  cursor: {},
});

export class GetPublicNoticesRequestDto extends GetPublicNoticesRequestDtoBase {
  @ApiPropertyOptional({ enum: NoticeImportance }) @IsOptional() @IsEnum(NoticeImportance) importance?: NoticeImportance;
}
