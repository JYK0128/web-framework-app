import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Notice } from '~/core/database/entities/notices';
import { AppEntityManager } from '~/core/database/entity-manager';
import { GetNoticeQuery } from '~/modules/notice/get-notice.query';
import { GetNoticeResponseDto } from '~/modules/notice/get-notice.response.dto';

@Injectable()
@QueryHandler(GetNoticeQuery)
export class GetNoticeHandler implements IQueryHandler<GetNoticeQuery, GetNoticeResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input, publicOnly }: GetNoticeQuery): Promise<GetNoticeResponseDto> {
    const notice = await this.em.findOne(Notice, { id: input.noticeId, ...(publicOnly ? { publishedAt: { $ne: null, $lte: new Date() } } : {}) });
    if (!notice) throw new ApplicationError({ code: 'NOTICE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    return GetNoticeResponseDto.parseEntity(notice);
  }
}
