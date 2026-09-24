import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

import { PageRequestDto } from '#/common/interfaces/request/page.request.dto';
import { Term } from '#/entities/terms/term.entity';

export class GetAdminServiceTermsRequestDto extends PageRequestDto<Term> {
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() groupId?: string;
  override get searchFields(): (keyof Term)[] { return ['version', 'content']; }

  override toFilterQuery() {
    const query = super.toFilterQuery();
    return this.groupId ? { $and: [query, { termGroup: this.groupId }] } : query;
  }
}
