import { Query } from '@nestjs/cqrs';

import type { GetQnaRequestDto } from '~/modules/qna/get-qna.request.dto';
import { GetQnaResponseDto } from '~/modules/qna/get-qna.response.dto';

export class GetAllQnaQuery extends Query<GetQnaResponseDto> {
  constructor(public readonly input: GetQnaRequestDto) {
    super();
  }
}
