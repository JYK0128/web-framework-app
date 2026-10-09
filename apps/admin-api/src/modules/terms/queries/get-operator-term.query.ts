import { Query } from '@nestjs/cqrs';

import type { OperatorTermDetailResponseDto } from '#/modules/terms/interfaces';

export class GetOperatorTermQuery extends Query<OperatorTermDetailResponseDto> {
  constructor(public readonly input: { termId: string }) { super(); }
}
