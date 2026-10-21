import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts';

import { AppEntityManager } from '~/core/database/entity-manager';
import { GetAllQnaQuery } from '~/modules/qna/get-all-qna.query';
import { GetQnaResponseDto } from '~/modules/qna/get-qna.response.dto';
import { findQna } from '~/modules/qna/qna.helpers';

@QueryHandler(GetAllQnaQuery)
export class GetAllQnaHandler implements IQueryHandler<GetAllQnaQuery, GetQnaResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}
  async execute({ input }: GetAllQnaQuery): Promise<GetQnaResponseDto> {
    const id = input.qnaId;
    const mine = false;
    const qna = await findQna(this.em, this.principal, id, mine);
    return GetQnaResponseDto.parseEntity(qna);
  }
}
