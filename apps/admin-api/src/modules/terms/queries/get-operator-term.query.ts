import { Query } from '@nestjs/cqrs';

import type { OperatorTermDetailResponseDto } from '#/modules/terms/dto';

export class GetOperatorTermQuery extends Query<OperatorTermDetailResponseDto> {
  constructor(public readonly input: { termId: string }) { super(); }
}
