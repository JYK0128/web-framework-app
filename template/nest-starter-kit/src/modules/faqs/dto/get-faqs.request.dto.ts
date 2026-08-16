import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

import { SearchableRequestDto, SortDirection } from '#/common/interfaces';
import { Faq } from '#/entities/faqs/faq.entity';

export const USER_FAQ_SORT = ['order', 'createdAt', 'helpfulCount'] as const;
export type UserFaqSortKey = (typeof USER_FAQ_SORT)[number];

export class GetFaqsRequestDto extends SearchableRequestDto<Faq, UserFaqSortKey> {
  override get searchFields(): (keyof Faq)[] {
    return ['question', 'answer'];
  }

  @ApiPropertyOptional({ description: '카테고리 필터' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: ['order', 'createdAt'], isArray: true, enum: USER_FAQ_SORT })
  @IsOptional()
  @IsIn(USER_FAQ_SORT, { each: true })
  override sort: UserFaqSortKey[] = ['order', 'createdAt'];

  @ApiPropertyOptional({ example: ['asc', 'desc'], isArray: true, enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection, { each: true })
  override direction: SortDirection[] = ['asc', 'desc'];
}
