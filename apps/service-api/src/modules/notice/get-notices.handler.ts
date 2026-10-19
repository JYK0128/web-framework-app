import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Notice } from '#/core/database/entities/notices';
import { AppEntityManager } from '#/core/database/entity-manager';
import { GetNoticesQuery } from '#/modules/notice/get-notices.query';
import { GetNoticesResponseDto } from '#/modules/notice/get-notices.response.dto';
import { NoticeItemDto } from '#/modules/notice/notice-item.dto';

@Injectable()
@QueryHandler(GetNoticesQuery)
export class GetNoticesHandler implements IQueryHandler<GetNoticesQuery, GetNoticesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetNoticesQuery): Promise<GetNoticesResponseDto> {
    const result = await this.em.findByPage<Notice>(Notice, input.toFilterQuery(), input.toPageOptions());
    return GetNoticesResponseDto.parse({ ...result, items: result.items.map((item) => NoticeItemDto.parseEntity(item)) });
  }
}
