import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';
import { isValid } from 'date-fns';

import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { AppEntityManager } from '#/database/entity-manager';
import { Notice, type NoticePriority } from '#/entities/notices/notice.entity';
import { NoticeRead } from '#/entities/notices/notice-read.entity';
import { UserProfileResponseDto } from '#/modules/auth/dto';

import { CreateNoticeRequestDto, GetAdminNoticesRequestDto, GetAdminNoticesResponseDto, GetNoticeFeedRequestDto, GetNoticeFeedResponseDto, GetNoticesResponseDto, MarkNoticeReadResponseDto, NoticeFeedItemDto, NoticeItemDto, UpdateNoticeRequestDto } from './dto';

@ApiTags('notices')
@Controller('notices')
export class NoticesController {
  constructor(
    @Inject(AppEntityManager)
    private readonly em: AppEntityManager,
  ) {}

  @Public()
  @Get()
  @SwaggerApiResponse(GetNoticesResponseDto)
  async getPublishedNotices(): Promise<GetNoticesResponseDto> {
    const notices = await this.em.find(Notice, {
      publishedAt: { $ne: null, $lte: new Date() },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }, {
      orderBy: { isPinned: 'DESC', priority: 'DESC', publishedAt: 'DESC' },
    });

    return { notices: notices.map((notice) => new NoticeItemDto(notice)) };
  }

  @Permission('notice:read')
  @Get('feed')
  @SwaggerApiResponse(GetNoticeFeedResponseDto)
  async getNoticeFeed(
    @Query() query: GetNoticeFeedRequestDto,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<GetNoticeFeedResponseDto> {
    const cursor = await this.em.findByCursor(Notice, {
      where: query.toFilterQuery(),
      ...query.toCursorOptions(),
    });
    const reads = cursor.items.length === 0
      ? []
      : await this.em.find(NoticeRead, { user: currentUser.id, notice: { $in: cursor.items.map((notice) => notice.id) } });
    const readIds = new Set(reads.map((read) => read.notice.id));

    return {
      items: cursor.items.map((notice) => new NoticeFeedItemDto(notice, readIds.has(notice.id))),
      startCursor: cursor.startCursor,
      endCursor: cursor.endCursor,
      hasNextPage: cursor.hasNextPage,
      hasPrevPage: cursor.hasPrevPage,
      totalCount: cursor.totalCount,
    };
  }

  @Permission('notice:read')
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(MarkNoticeReadResponseDto)
  async markAllNoticesRead(
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<MarkNoticeReadResponseDto> {
    const now = new Date();
    const notices = await this.em.find(Notice, {
      publishedAt: { $ne: null, $lte: now },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    });
    if (notices.length > 0) {
      const reads = await this.em.find(NoticeRead, {
        user: currentUser.id,
        notice: { $in: notices.map((n) => n.id) },
      });
      const readNoticeIds = new Set(reads.map((r) => r.notice.id));
      const unreadNotices = notices.filter((n) => !readNoticeIds.has(n.id));

      for (const notice of unreadNotices) {
        const read = this.em.create(NoticeRead, { user: currentUser.id, notice: notice.id });
        this.em.persist(read);
      }
      if (unreadNotices.length > 0) {
        await this.em.flush();
      }
    }

    const response = new MarkNoticeReadResponseDto();
    response.isRead = true;
    response.readAt = new Date();
    return response;
  }

  @Permission('notice:read')
  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(MarkNoticeReadResponseDto)
  async markNoticeRead(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<MarkNoticeReadResponseDto> {
    const notice = await this.requirePublishedNotice(id);
    let read = await this.em.findOne(NoticeRead, { user: currentUser.id, notice: notice.id });
    if (!read) {
      read = this.em.create(NoticeRead, { user: currentUser.id, notice: notice.id });
      this.em.persist(read);
      await this.em.flush();
    }

    const response = new MarkNoticeReadResponseDto();
    response.isRead = true;
    response.readAt = read.readAt;
    return response;
  }

  @Permission('notice:manage')
  @Get('admin')
  @SwaggerApiResponse(GetAdminNoticesResponseDto)
  async getAdminNotices(@Query() query: GetAdminNoticesRequestDto): Promise<GetAdminNoticesResponseDto> {
    const pageResult = await this.em.findByPage(Notice, query.toFilterQuery(), query.toPageOptions());

    return {
      ...pageResult,
      items: pageResult.items.map((notice) => new NoticeItemDto(notice)),
    };
  }

  @Permission('notice:manage')
  @Get('admin/:id')
  @SwaggerApiResponse(NoticeItemDto)
  async getAdminNotice(@Param('id') id: string): Promise<NoticeItemDto> {
    return new NoticeItemDto(await this.requireNotice(id));
  }

  @Permission('notice:create')
  @Post('admin')
  @SwaggerApiResponse(NoticeItemDto, HttpStatus.CREATED)
  async createNotice(@Body() input: CreateNoticeRequestDto): Promise<NoticeItemDto> {
    const notice = this.em.create(Notice, {
      title: input.title.trim(),
      content: input.content.trim(),
      isPinned: input.isPinned ?? false,
      priority: (input.priority ?? 0) as NoticePriority,
      publishedAt: this.parsePublishedAt(input.publishedAt),
      expiresAt: this.parsePublishedAt(input.expiresAt),
    });
    this.em.persist(notice);
    await this.em.flush();

    return new NoticeItemDto(notice);
  }

  @Permission('notice:update')
  @Patch('admin/:id')
  @SwaggerApiResponse(NoticeItemDto)
  async updateNotice(
    @Param('id') id: string,
    @Body() input: UpdateNoticeRequestDto,
  ): Promise<NoticeItemDto> {
    const notice = await this.requireNotice(id);
    if (input.title !== undefined) notice.title = input.title.trim();
    if (input.content !== undefined) notice.content = input.content.trim();
    if (input.isPinned !== undefined) notice.isPinned = input.isPinned;
    if (input.priority !== undefined) notice.priority = input.priority as NoticePriority;
    if (input.publishedAt !== undefined) notice.publishedAt = this.parsePublishedAt(input.publishedAt);
    if (input.expiresAt !== undefined) notice.expiresAt = this.parsePublishedAt(input.expiresAt);
    await this.em.flush();

    return new NoticeItemDto(notice);
  }

  @Permission('notice:delete')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(NoticeItemDto)
  async deleteNotice(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<NoticeItemDto> {
    const notice = await this.requireNotice(id);
    notice.deletedAt = new Date();
    notice.deletedBy = currentUser.id;
    await this.em.flush();

    return new NoticeItemDto(notice);
  }

  private async requireNotice(id: string): Promise<Notice> {
    const notice = await this.em.findOne(Notice, { id }, { filters: false });
    if (!notice || notice.deletedAt) {
      throw new ApplicationError({ code: 'NOTICE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    return notice;
  }

  private async requirePublishedNotice(id: string): Promise<Notice> {
    const notice = await this.requireNotice(id);
    if (!notice.isPublished) {
      throw new ApplicationError({ code: 'NOTICE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    return notice;
  }

  private parsePublishedAt(value: Date | null | undefined): Date | null {
    if (value === undefined || value === null) return null;
    if (!isValid(value)) {
      throw new ApplicationError({ code: 'INVALID_PUBLISHED_AT', status: HttpStatus.BAD_REQUEST });
    }
    return value;
  }
}
