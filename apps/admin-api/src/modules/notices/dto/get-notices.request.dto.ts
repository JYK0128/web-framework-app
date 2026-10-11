import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import type { BaseEntity } from '#/core/database/entities/common/base.entity';
import { PageRequestDto } from '#/core/http/dto/request/page.request.dto';
import { NOTICE_IMPORTANCE, PUBLICATION_STATUS } from '#/modules/notices/dto/notices.constants';

export class GetNoticesRequestDto extends PageRequestDto<BaseEntity, 'createdAt' | 'publishedAt'> {
  @ApiPropertyOptional({ enum: PUBLICATION_STATUS }) @IsOptional() @IsIn(PUBLICATION_STATUS) status?: typeof PUBLICATION_STATUS[number];
  @ApiPropertyOptional({ enum: NOTICE_IMPORTANCE }) @IsOptional() @IsIn(NOTICE_IMPORTANCE) importance?: typeof NOTICE_IMPORTANCE[number];
  override sort: ('createdAt' | 'publishedAt')[] = ['createdAt'];
}
