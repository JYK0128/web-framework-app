import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { AdminPermission } from '@pkg/shared';

import { InternalClient } from '#/core/internal-client';
import { CreateNoticeRequestDto } from '#/modules/notice/create-notice.request.dto';
import { CreateNoticeResponseDto } from '#/modules/notice/create-notice.response.dto';
import { DeleteNoticeRequestDto } from '#/modules/notice/delete-notice.request.dto';
import { DeleteNoticeResponseDto } from '#/modules/notice/delete-notice.response.dto';
import { GetNoticesRequestDto } from '#/modules/notice/get-notices.request.dto';
import { GetNoticesResponseDto } from '#/modules/notice/get-notices.response.dto';
import { UpdateNoticeRequestDto } from '#/modules/notice/update-notice.request.dto';
import { UpdateNoticeResponseDto } from '#/modules/notice/update-notice.response.dto';

@ApiTags('notices')
@UserAuth()
@Controller('notices')
export class NoticesController {
  constructor(private readonly client: InternalClient) {}
  @Permissions(AdminPermission.notice.read)
  @SwaggerApiResponse(GetNoticesResponseDto)
  @Get()
  list(@Query() query: GetNoticesRequestDto): Promise<GetNoticesResponseDto> {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    for (const sort of query.sort) params.append('sort[]', sort);
    for (const direction of query.direction) params.append('direction[]', direction);
    if (query.search) params.set('search', query.search);
    if (query.importance) params.set('importance', query.importance);
    return this.client.fetch(`/internal/notices?${params.toString()}`);
  }

  @Permissions(AdminPermission.notice.create)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateNoticeResponseDto, HttpStatus.CREATED)
  create(@Body() input: CreateNoticeRequestDto): Promise<CreateNoticeResponseDto> { return this.client.fetch('/internal/notices', { method: 'POST', body: input }); }

  @Permissions(AdminPermission.notice.update)
  @Patch(':id')
  @SwaggerApiResponse(UpdateNoticeResponseDto)
  update(@Param('id') id: string, @Body() input: UpdateNoticeRequestDto): Promise<UpdateNoticeResponseDto> { return this.client.fetch(`/internal/notices/${id}`, { method: 'PATCH', body: input }); }

  @Permissions(AdminPermission.notice.delete)
  @Delete(':id')
  @SwaggerApiResponse(DeleteNoticeResponseDto)
  remove(@Param('id') id: string): Promise<DeleteNoticeResponseDto> {
    const request = DeleteNoticeRequestDto.parse({ noticeId: id }).validate();
    return this.client.fetch(`/internal/notices/${request.noticeId}`, { method: 'DELETE' });
  }
}
