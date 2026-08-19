import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import type { AuthPrincipal } from '#/common/security/auth-token.types';

import { CreateNoticeCommand, DeleteNoticeCommand, MarkAllNoticesReadCommand, MarkNoticeReadCommand, UpdateNoticeCommand } from './commands';
import { CreateNoticeRequestDto, GetAdminNoticesRequestDto, GetAdminNoticesResponseDto, GetNoticeFeedRequestDto, GetNoticeFeedResponseDto, GetNoticesResponseDto, MarkNoticeReadResponseDto, NoticeItemDto, UpdateNoticeRequestDto } from './dto';
import { GetAdminNoticeQuery, GetAdminNoticesQuery, GetNoticeFeedQuery, GetPublishedNoticesQuery } from './queries';

@ApiTags('notices')
@Controller('notices')
export class NoticesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Get()
  @SwaggerApiResponse(GetNoticesResponseDto)
  async getPublishedNotices(): Promise<GetNoticesResponseDto> {
    return this.queryBus.execute(new GetPublishedNoticesQuery());
  }

  @Permission('notice:read')
  @Get('feed')
  @SwaggerApiResponse(GetNoticeFeedResponseDto)
  async getNoticeFeed(
    @Query() query: GetNoticeFeedRequestDto,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<GetNoticeFeedResponseDto> {
    return this.queryBus.execute(new GetNoticeFeedQuery(query, currentUser.id));
  }

  @Permission('notice:read')
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(MarkNoticeReadResponseDto)
  async markAllNoticesRead(
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<MarkNoticeReadResponseDto> {
    return this.commandBus.execute(new MarkAllNoticesReadCommand(currentUser.id));
  }

  @Permission('notice:read')
  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(MarkNoticeReadResponseDto)
  async markNoticeRead(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<MarkNoticeReadResponseDto> {
    return this.commandBus.execute(new MarkNoticeReadCommand(id, currentUser.id));
  }

  @Permission('notice:manage', 'notice:read')
  @Get('admin')
  @SwaggerApiResponse(GetAdminNoticesResponseDto)
  async getAdminNotices(@Query() query: GetAdminNoticesRequestDto): Promise<GetAdminNoticesResponseDto> {
    return this.queryBus.execute(new GetAdminNoticesQuery(query));
  }

  @Permission('notice:manage', 'notice:read')
  @Get('admin/:id')
  @SwaggerApiResponse(NoticeItemDto)
  async getAdminNotice(@Param('id') id: string): Promise<NoticeItemDto> {
    return this.queryBus.execute(new GetAdminNoticeQuery(id));
  }

  @Permission('notice:manage', 'notice:create')
  @Post('admin')
  @SwaggerApiResponse(NoticeItemDto, HttpStatus.CREATED)
  async createNotice(@Body() input: CreateNoticeRequestDto): Promise<NoticeItemDto> {
    return this.commandBus.execute(new CreateNoticeCommand(input));
  }

  @Permission('notice:manage', 'notice:update')
  @Patch('admin/:id')
  @SwaggerApiResponse(NoticeItemDto)
  async updateNotice(
    @Param('id') id: string,
    @Body() input: UpdateNoticeRequestDto,
  ): Promise<NoticeItemDto> {
    return this.commandBus.execute(new UpdateNoticeCommand(id, input));
  }

  @Permission('notice:manage', 'notice:delete')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(NoticeItemDto)
  async deleteNotice(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<NoticeItemDto> {
    return this.commandBus.execute(new DeleteNoticeCommand(id, currentUser.id));
  }
}
