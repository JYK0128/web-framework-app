import { Query } from '@nestjs/cqrs';

import type { GetTermRevisionsRequestDto } from '#/modules/service-terms/revisions/get-term-revisions.request.dto';
import { GetTermRevisionsResponseDto } from '#/modules/service-terms/revisions/get-term-revisions.response.dto';

export class GetTermRevisionsQuery extends Query<GetTermRevisionsResponseDto> {
  constructor(public readonly input: { groupId: string, dto: GetTermRevisionsRequestDto }) {
    super();
  }
}
