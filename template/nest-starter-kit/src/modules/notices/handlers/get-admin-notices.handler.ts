import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppEntityManager, type PageResult } from '#/database/entity-manager';
import { Notice } from '#/entities/notices/notice.entity';
import { GetAdminNoticesRequestDto, GetAdminNoticesResponseDto, NoticeItemDto } from '#/modules/notices/dto';
import { GetAdminNoticesQuery } from '#/modules/notices/queries/get-admin-notices.query';

@Injectable()
@QueryHandler(GetAdminNoticesQuery)
export class GetAdminNoticesHandler implements IQueryHandler<GetAdminNoticesQuery, GetAdminNoticesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetAdminNoticesQuery): Promise<GetAdminNoticesResponseDto> {
    const pageResult = await this.identify(query.query);
    return this.process(pageResult);
  }

  private async identify(query: GetAdminNoticesRequestDto): Promise<PageResult<Notice>> {
    return this.em.findByPage(Notice, query.toFilterQuery(), {
      ...query.toPageOptions(),
      filters: false,
    });
  }

  private process(pageResult: PageResult<Notice>): GetAdminNoticesResponseDto {
    return {
      ...pageResult,
      items: pageResult.items.map((notice) => new NoticeItemDto(notice)),
    };
  }
}
