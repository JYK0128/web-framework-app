import { Query } from '@nestjs/cqrs';

import type { GetOwnQnaRequestDto } from '#/modules/qna/get-own-qna.request.dto';
import { GetOwnQnaResponseDto } from '#/modules/qna/get-own-qna.response.dto';

export class GetOwnQnaQuery extends Query<GetOwnQnaResponseDto> {
  constructor(public readonly input: GetOwnQnaRequestDto) {
    super();
  }
}
