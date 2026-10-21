import { Query } from '@nestjs/cqrs';

import type { GetTermRequestDto } from '~/modules/term/document/get-term.request.dto';
import type { GetTermResponseDto } from '~/modules/term/document/get-term.response.dto';

export class GetTermQuery extends Query<GetTermResponseDto> {
  constructor(public readonly input: GetTermRequestDto) { super(); }
}
