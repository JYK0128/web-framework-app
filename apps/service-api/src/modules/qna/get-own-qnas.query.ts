import { Query } from '@nestjs/cqrs';

import type { GetQnasRequestDto } from '#/modules/qna/get-qnas.request.dto';
import { GetQnasResponseDto } from '#/modules/qna/get-qnas.response.dto';

export class GetOwnQnasQuery extends Query<GetQnasResponseDto> {
  constructor(public readonly input: GetQnasRequestDto) {
    super();
  }
}
