import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { Qna } from '~/core/database/entities/qna';
import { GetAllQnasQuery } from '~/modules/qna/get-all-qnas.query';
import { GetQnasResponseDto } from '~/modules/qna/get-qnas.response.dto';
import { QnaItemDto } from '~/modules/qna/qna-item.dto';

@QueryHandler(GetAllQnasQuery)
export class GetAllQnasHandler implements IQueryHandler<GetAllQnasQuery, GetQnasResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetAllQnasQuery): Promise<GetQnasResponseDto> {
    const { where, ...options } = input.toQuery();
    const result = await this.em.findByPage(Qna, where, { ...options, populate: ['user.profile', 'assignee.profile'] });
    return GetQnasResponseDto.parse({ ...result, items: result.items.map((item) => QnaItemDto.parseEntity(item)) });
  }
}
