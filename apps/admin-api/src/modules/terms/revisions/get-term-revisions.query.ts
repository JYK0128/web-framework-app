import { Query } from '@nestjs/cqrs';

import type { GetTermRevisionsRequestDto } from '#/modules/terms/revisions/get-term-revisions.request.dto';
import type { GetTermRevisionsResponseDto } from '#/modules/terms/revisions/get-term-revisions.response.dto';

export class GetTermRevisionsQuery extends Query<GetTermRevisionsResponseDto> {
  constructor(public readonly input: { groupId: string, dto: GetTermRevisionsRequestDto }) { super(); }
}
