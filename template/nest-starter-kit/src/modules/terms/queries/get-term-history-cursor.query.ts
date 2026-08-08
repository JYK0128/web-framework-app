import { Query } from '@nestjs/cqrs';

import { GetTermHistoryCursorRequestDto } from '#/modules/terms/dto/get-term-history-cursor.request.dto';
import { GetTermHistoryCursorResponseDto } from '#/modules/terms/dto/get-term-history-cursor.response.dto';

export class GetTermHistoryCursorQuery extends Query<GetTermHistoryCursorResponseDto> {
  constructor(public readonly input: GetTermHistoryCursorRequestDto) { super(); }
}
