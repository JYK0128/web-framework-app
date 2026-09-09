import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { SessionContext } from '#/common/contexts/session.context';
import { Notice } from '#/entities/notices/notice.entity';
import { NoticeRead } from '#/entities/notices/notice-read.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { MarkAllNoticesReadCommand } from '#/modules/notices/commands/mark-all-notices-read.command';
import { MarkAllNoticesReadResponseDto } from '#/modules/notices/dto';

@Injectable()
@CommandHandler(MarkAllNoticesReadCommand)
export class MarkAllNoticesReadHandler implements ICommandHandler<MarkAllNoticesReadCommand, MarkAllNoticesReadResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(): Promise<MarkAllNoticesReadResponseDto> {
    const userId = this.sessionContext.requiredUser.id;
    const notices = await this.identifyNotices();
    const reads = await this.identifyReads(userId, notices);
    this.verify(notices, reads);

    return this.process(userId, notices, reads);
  }

  private verify(notices: Notice[], reads: NoticeRead[]): void {
    if (!Array.isArray(notices) || !Array.isArray(reads)) {
      throw new Error('공지 읽음 상태를 확인할 수 없습니다.');
    }
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
  ): Promise<MarkAllNoticesReadResponseDto> {
    if (notices.length > 0) {
      const readNoticeIds = new Set(reads.map((r) => r.notice.id));
      const unreadNotices = notices.filter((n) => !readNoticeIds.has(n.id));

      for (const notice of unreadNotices) {
        const read = this.em.create(NoticeRead, { user: userId, notice: notice.id });
        this.em.persist(read);
      }
    }

    return { ok: true };
  }
}
