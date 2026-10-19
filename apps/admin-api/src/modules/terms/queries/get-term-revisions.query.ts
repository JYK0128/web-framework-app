import { Query } from '@nestjs/cqrs';

import type { GetTermRevisionsRequestDto, TermRevisionPageResponseDto } from '#/modules/terms/interfaces';

export class GetTermRevisionsQuery extends Query<TermRevisionPageResponseDto> {
  constructor(public readonly input: { groupId: string, dto: GetTermRevisionsRequestDto }) { super(); }
}
