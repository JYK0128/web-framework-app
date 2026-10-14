import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageRequestDto } from '@pkg/server-core/http/dto/request/page.request.dto';
import { QnaPriority, QnaStatus } from '@pkg/shared/constants';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import { Qna, QnaCategory } from '#/core/database/entities/qna';

export class GetQnasRequestDto extends PageRequestDto<Qna, 'createdAt' | 'updatedAt'> {
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'updatedAt'] })
  @IsIn(['createdAt', 'updatedAt'], { each: true })
  override sort: ('createdAt' | 'updatedAt')[] = ['createdAt'];

  @ApiPropertyOptional({ enum: QnaCategory }) @IsOptional() @IsEnum(QnaCategory) category?: QnaCategory;
  @ApiPropertyOptional({ enum: QnaStatus }) @IsOptional() @IsEnum(QnaStatus) status?: QnaStatus;
  @ApiPropertyOptional({ enum: QnaPriority }) @IsOptional() @IsEnum(QnaPriority) priority?: QnaPriority;
  override get searchFields(): (keyof Qna)[] {
    return ['title', 'content'];
  }

  override toFilterQuery() {
    const query = super.toFilterQuery();
    return {
      $and: [
        query,
        ...(this.category ? [{ category: this.category }] : []),
        ...(this.status ? [{ status: this.status }] : []),
        ...(this.priority ? [{ priority: this.priority }] : []),
      ],
    };
  }
}
