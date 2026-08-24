import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import type { AuthPrincipal } from 'express-session';

import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { EventBroker } from '#/infra/event-broker';

import { CreateNoticeCommand, DeleteNoticeCommand, MarkAllNoticesReadCommand, MarkNoticeReadCommand, UpdateNoticeCommand } from './commands';
import { CreateNoticeRequestDto, CreateNoticeResponseDto, DeleteNoticeResponseDto, GetAdminNoticeResponseDto, GetAdminNoticesRequestDto, GetAdminNoticesResponseDto, GetNoticeFeedRequestDto, GetNoticeFeedResponseDto, GetNoticesResponseDto, MarkAllNoticesReadResponseDto, MarkNoticeReadResponseDto, UpdateNoticeRequestDto, UpdateNoticeResponseDto } from './dto';
import { NoticeCreatedEvent } from './events';
import { GetAdminNoticeQuery, GetAdminNoticesQuery, GetNoticeFeedQuery, GetPublishedNoticesQuery } from './queries';

@ApiTags('notices')
@Controller('notices')
export class NoticesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBroker: EventBroker,
  ) {}

  @Public()
  @Get()
  @SwaggerApiResponse(GetNoticesResponseDto)
  async getNotices(): Promise<GetNoticesResponseDto> {
    return this.queryBus.execute(new GetPublishedNoticesQuery());
  }

  @Public()
  @Get('feed')
  @SwaggerApiResponse(GetNoticeFeedResponseDto)
  async getNoticeFeed(
    @Query() query: GetNoticeFeedRequestDto,
    @CurrentUser() currentUser?: AuthPrincipal,
  ): Promise<GetNoticeFeedResponseDto> {
    return this.queryBus.execute(new GetNoticeFeedQuery({ query, userId: currentUser?.id }));
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(MarkAllNoticesReadResponseDto)
  async markAllAsRead(@CurrentUser() currentUser: AuthPrincipal): Promise<MarkAllNoticesReadResponseDto> {
    return this.commandBus.execute(new MarkAllNoticesReadCommand({ userId: currentUser.id }));
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(MarkNoticeReadResponseDto)
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<MarkNoticeReadResponseDto> {
    return this.commandBus.execute(new MarkNoticeReadCommand({ id, userId: currentUser.id }));
  }

  @Permission('notice:manage', 'notice:read')
  @Get('admin')
  @SwaggerApiResponse(GetAdminNoticesResponseDto)
  async getAdminNotices(@Query() query: GetAdminNoticesRequestDto): Promise<GetAdminNoticesResponseDto> {
    return this.queryBus.execute(new GetAdminNoticesQuery(query));
  }

  @Permission('notice:manage', 'notice:read')
  @Get('admin/:id')
  @SwaggerApiResponse(GetAdminNoticeResponseDto)
  async getAdminNotice(@Param('id') id: string): Promise<GetAdminNoticeResponseDto> {
    return this.queryBus.execute(new GetAdminNoticeQuery({ id }));
  }

  @Permission('notice:manage', 'notice:create')
  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateNoticeResponseDto, HttpStatus.CREATED)
  async createNotice(@Body() input: CreateNoticeRequestDto): Promise<CreateNoticeResponseDto> {
    const result = await this.commandBus.execute(new CreateNoticeCommand(input));
    await this.eventBroker.publish(new NoticeCreatedEvent(result));
    return result;
  }

  @Permission('notice:manage', 'notice:update')
  @Patch('admin/:id')
  @SwaggerApiResponse(UpdateNoticeResponseDto)
  async updateNotice(
    @Param('id') id: string,
    @Body() input: UpdateNoticeRequestDto,
  ): Promise<UpdateNoticeResponseDto> {
    return this.commandBus.execute(new UpdateNoticeCommand({ id, input }));
  }

  @Permission('notice:manage', 'notice:delete')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DeleteNoticeResponseDto)
  async deleteNotice(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<DeleteNoticeResponseDto> {
    return this.commandBus.execute(new DeleteNoticeCommand({ id, deletedBy: currentUser.id }));
  }
}
