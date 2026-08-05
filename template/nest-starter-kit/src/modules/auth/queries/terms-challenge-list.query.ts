import { Query } from '@nestjs/cqrs';

import { TermsChallengeListRequestDto } from '#/modules/auth/dto/terms-challenge-list.request.dto';
import { TermsChallengeListResponseDto } from '#/modules/auth/dto/terms-challenge-list.response.dto';

export class TermsChallengeListQuery extends Query<TermsChallengeListResponseDto> {
  constructor(public readonly input: TermsChallengeListRequestDto) { super(); }
}
