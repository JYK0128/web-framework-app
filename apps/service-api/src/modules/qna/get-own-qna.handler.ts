import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { PrincipalContext } from '@pkg/server-core/http/contexts';

import { GetOwnQnaQuery } from '~/modules/qna/get-own-qna.query';
import { GetOwnQnaResponseDto } from '~/modules/qna/get-own-qna.response.dto';
import { findQna } from '~/modules/qna/qna.helpers';

@QueryHandler(GetOwnQnaQuery)
export class GetOwnQnaHandler implements IQueryHandler<GetOwnQnaQuery, GetOwnQnaResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}
  async execute({ input }: GetOwnQnaQuery): Promise<GetOwnQnaResponseDto> {
    const id = input.qnaId;
    const mine = true;
    const qna = await findQna(this.em, this.principal, id, mine);
    return GetOwnQnaResponseDto.parseEntity(qna);
  }
}
