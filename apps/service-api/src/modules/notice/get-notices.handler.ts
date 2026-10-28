import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { Notice } from '~/core/database/entities/notices';
import { GetNoticesQuery } from '~/modules/notice/get-notices.query';
import { GetNoticesResponseDto } from '~/modules/notice/get-notices.response.dto';
import { NoticeItemDto } from '~/modules/notice/notice-item.dto';

@Injectable()
@QueryHandler(GetNoticesQuery)
export class GetNoticesHandler implements IQueryHandler<GetNoticesQuery, GetNoticesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetNoticesQuery): Promise<GetNoticesResponseDto> {
    const { where, ...options } = input.toQuery();
    const result = await this.em.findByPage<Notice>(Notice, where, options);
    return GetNoticesResponseDto.parse({ ...result, items: result.items.map((item) => NoticeItemDto.parseEntity(item)) });
  }
}
