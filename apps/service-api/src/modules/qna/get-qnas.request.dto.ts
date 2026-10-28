import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryRequestDtoFor } from '@pkg/server-core/http/dto/request';
import { QnaPriority, QnaStatus } from '@pkg/shared/constants';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import { Qna, QnaCategory } from '~/core/database/entities/qna';

const GetQnasRequestDtoBase = QueryRequestDtoFor<Qna>()({
  search: { fields: ['title', 'content'] },
  sort: { fields: ['createdAt', 'updatedAt'], default: ['createdAt'] },
  page: {},
});

export class GetQnasRequestDto extends GetQnasRequestDtoBase {
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'updatedAt'] })
  @IsIn(['createdAt', 'updatedAt'], { each: true })
  override sort: ('createdAt' | 'updatedAt')[] = ['createdAt'];

  @ApiPropertyOptional({ enum: QnaCategory }) @IsOptional() @IsEnum(QnaCategory) category?: QnaCategory;
  @ApiPropertyOptional({ enum: QnaStatus }) @IsOptional() @IsEnum(QnaStatus) status?: QnaStatus;
  @ApiPropertyOptional({ enum: QnaPriority }) @IsOptional() @IsEnum(QnaPriority) priority?: QnaPriority;

  override toQuery() {
    const query = super.toQuery();
    return {
      ...query,
      where: {
        $and: [
          query.where,
          ...(this.category ? [{ category: this.category }] : []),
          ...(this.status ? [{ status: this.status }] : []),
          ...(this.priority ? [{ priority: this.priority }] : []),
        ],
      },
    };
  }
}
