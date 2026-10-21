import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts';

import { Qna } from '~/core/database/entities/qna';
import { AppEntityManager } from '~/core/database/entity-manager';
import { GetOwnQnasQuery } from '~/modules/qna/get-own-qnas.query';
import { GetQnasResponseDto } from '~/modules/qna/get-qnas.response.dto';
import { QnaItemDto } from '~/modules/qna/qna-item.dto';

@QueryHandler(GetOwnQnasQuery)
export class GetOwnQnasHandler implements IQueryHandler<GetOwnQnasQuery, GetQnasResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}
  async execute({ input }: GetOwnQnasQuery): Promise<GetQnasResponseDto> {
    const where = { $and: [input.toFilterQuery(), { user: this.principal.ensureUser().id }] };
    const result = await this.em.findByPage(Qna, where, { ...input.toPageOptions(), populate: ['user.profile', 'assignee.profile'] });
    return GetQnasResponseDto.parse({ ...result, items: result.items.map((item) => QnaItemDto.parseEntity(item)) });
  }
}
