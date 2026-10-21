import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageRequestDto } from '@pkg/server-core/http/dto/request';
import { NoticeImportance } from '@pkg/shared/constants';
import { IsEnum, IsOptional } from 'class-validator';

import type { BaseEntity } from '~/core/database/entities/base.entity';

export class GetNoticesRequestDto extends PageRequestDto<BaseEntity, 'createdAt' | 'publishedAt'> {
  @ApiPropertyOptional({ enum: NoticeImportance }) @IsOptional() @IsEnum(NoticeImportance) importance?: NoticeImportance;
  override sort: ('createdAt' | 'publishedAt')[] = ['createdAt'];
}
