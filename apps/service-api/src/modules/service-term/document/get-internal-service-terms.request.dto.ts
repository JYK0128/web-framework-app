import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryRequestDtoFor, SortDirection } from '@pkg/server-core/http/dto/request';
import { IsOptional, IsUUID } from 'class-validator';

import { Term } from '~/core/database/entities/terms';

const GetInternalServiceTermsRequestDtoBase = QueryRequestDtoFor<Term>()({
  search: { fields: ['version', 'content'] },
  sort: { fields: ['title', 'version', 'isNoticeRequired', 'isRequired', 'publishedAt', 'createdAt', 'updatedAt'], default: ['createdAt'] },
  page: {},
});

export class GetInternalServiceTermsRequestDto extends GetInternalServiceTermsRequestDtoBase {
  override toQuery() {
    const query = super.toQuery();
    return {
      ...query,
      where: this.groupId ? { $and: [query.where, { termGroup: this.groupId }] } : query.where,
      orderBy: this.sort.map((field, index) => {
        const direction = this.direction[index] ?? SortDirection.ASC;
        if (field === 'title' || field === 'isRequired') return { termGroup: { [field]: direction } };
        return { [field]: direction };
      }),
    };
  }

  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() groupId?: string;
}
