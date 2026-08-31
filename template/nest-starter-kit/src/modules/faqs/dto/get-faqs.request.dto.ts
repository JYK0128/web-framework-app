import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { ListRequestDto, SortDirection } from '#/common/interfaces';
import { Faq } from '#/entities/faqs/faq.entity';

export const USER_FAQ_SORT = ['order', 'createdAt'] as const;
export type UserFaqSortKey = (typeof USER_FAQ_SORT)[number];
export class GetFaqsRequestDto extends ListRequestDto<Faq, UserFaqSortKey> {
  override get searchFields(): (keyof Faq)[] {
    return ['question', 'answer'];
  }

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ isArray: true, enum: USER_FAQ_SORT })
  @IsOptional()
  @IsIn(USER_FAQ_SORT, { each: true })
  override sort: UserFaqSortKey[] = ['order', 'createdAt'];

  @ApiEnumOptional({ isArray: true, enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection, { each: true })
  override direction: SortDirection[] = ['asc', 'desc'];
}
