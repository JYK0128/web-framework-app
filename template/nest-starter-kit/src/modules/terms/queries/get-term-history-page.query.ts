import { Query } from '@nestjs/cqrs';

import { GetTermHistoryPageRequestDto } from '#/modules/terms/dto/get-term-history-page.request.dto';
import { GetTermHistoryPageResponseDto } from '#/modules/terms/dto/get-term-history-page.response.dto';

export class GetTermHistoryPageQuery extends Query<GetTermHistoryPageResponseDto> {
  constructor(public readonly input: GetTermHistoryPageRequestDto) { super(); }
}
