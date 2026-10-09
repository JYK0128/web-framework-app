import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { InternalServiceClient } from '#/infra/auth/machine/internal-service-client.service';

import { CreateNoticeRequestDto, GetNoticesRequestDto, NoticeActionResponseDto, NoticeItemDto, NoticePageResponseDto, UpdateNoticeRequestDto } from './notices.dto';

@ApiTags('notices')
@UserAuth()
@Controller('notices')
export class NoticesController {
  constructor(private readonly client: InternalServiceClient) {}
  @Permissions(AdminPermission.notice.read)
  @SwaggerApiResponse(NoticePageResponseDto)
  @Get()
  list(@Query() query: GetNoticesRequestDto): Promise<NoticePageResponseDto> {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    for (const sort of query.sort) params.append('sort[]', sort);
    for (const direction of query.direction) params.append('direction[]', direction);
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.importance) params.set('importance', query.importance);
    return this.client.fetch(`/internal/notices?${params.toString()}`);
  }

  @Permissions(AdminPermission.notice.create)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(NoticeItemDto, HttpStatus.CREATED)
  create(@Body() input: CreateNoticeRequestDto): Promise<NoticeItemDto> { return this.client.fetch('/internal/notices', { method: 'POST', body: input }); }

  @Permissions(AdminPermission.notice.update)
  @Patch(':id')
  @SwaggerApiResponse(NoticeItemDto)
  update(@Param('id') id: string, @Body() input: UpdateNoticeRequestDto): Promise<NoticeItemDto> { return this.client.fetch(`/internal/notices/${id}`, { method: 'PATCH', body: input }); }

  @Permissions(AdminPermission.notice.delete)
  @Delete(':id')
  @SwaggerApiResponse(NoticeActionResponseDto)
  remove(@Param('id') id: string): Promise<NoticeActionResponseDto> { return this.client.fetch(`/internal/notices/${id}`, { method: 'DELETE' }); }
}
