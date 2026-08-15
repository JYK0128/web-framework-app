import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/database/entity-manager';
import { Notice } from '#/entities/notices/notice.entity';
import { NoticeRead } from '#/entities/notices/notice-read.entity';
import { MarkAllNoticesReadCommand } from '#/modules/notices/commands/mark-all-notices-read.command';
import { MarkNoticeReadResponseDto } from '#/modules/notices/dto';

@Injectable()
@CommandHandler(MarkAllNoticesReadCommand)
export class MarkAllNoticesReadHandler implements ICommandHandler<MarkAllNoticesReadCommand, MarkNoticeReadResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: MarkAllNoticesReadCommand): Promise<MarkNoticeReadResponseDto> {
    const notices = await this.identifyNotices();
    const reads = await this.identifyReads(command.userId, notices);

    return this.process(command.userId, notices, reads);
  }

  private async identifyNotices(): Promise<Notice[]> {
    const now = new Date();
    return this.em.find(Notice, {
      publishedAt: { $ne: null, $lte: now },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    });
  }

  private async identifyReads(userId: string, notices: Notice[]): Promise<NoticeRead[]> {
    if (notices.length === 0) return [];
    return this.em.find(NoticeRead, {
      user: userId,
      notice: { $in: notices.map((n) => n.id) },
    });
  }

  private async process(
    userId: string,
    notices: Notice[],
    reads: NoticeRead[],
  ): Promise<MarkNoticeReadResponseDto> {
    if (notices.length > 0) {
      const readNoticeIds = new Set(reads.map((r) => r.notice.id));
      const unreadNotices = notices.filter((n) => !readNoticeIds.has(n.id));

      for (const notice of unreadNotices) {
        const read = this.em.create(NoticeRead, { user: userId, notice: notice.id });
        this.em.persist(read);
      }
    }

    const response = new MarkNoticeReadResponseDto();
    response.isRead = true;
    response.readAt = new Date();
    return response;
  }
}
