import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';
import { InternalClient } from '#/core/http/internal-client';

import { GetQnaRequestDto, QnaActionResponseDto, QnaItemDto, QnaPageResponseDto, UpdateQnaRequestDto } from '.';

@ApiTags('qna') @UserAuth() @Controller('qna')
export class QnaController {
  constructor(private readonly internalClient: InternalClient) {}
  @Get()
  @Permissions(AdminPermission.qna.read)
  @SwaggerApiResponse(QnaPageResponseDto)
  list(@Query() query: GetQnaRequestDto) {
    return this.internalClient.fetch(`/internal/qna?${this.params(query)}`);
  }

  @Get(':id')
  @Permissions(AdminPermission.qna.read)
  @SwaggerApiResponse(QnaItemDto)
  get(@Param('id') id: string) {
    return this.internalClient.fetch(`/internal/qna/${id}`);
  }

  @Patch(':id')
  @Permissions(AdminPermission.qna.update)
  @SwaggerApiResponse(QnaItemDto)
  update(@Param('id') id: string, @Body() input: UpdateQnaRequestDto) {
    return this.internalClient.fetch(`/internal/qna/${id}`, { method: 'PATCH', body: input });
  }

  @Delete(':id')
  @Permissions(AdminPermission.qna.delete)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(QnaActionResponseDto)
  remove(@Param('id') id: string) {
    return this.internalClient.fetch(`/internal/qna/${id}`, { method: 'DELETE' });
  }

  private params(query: GetQnaRequestDto): string {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    for (const field of query.sort) params.append('sort[]', field);
    for (const direction of query.direction) params.append('direction[]', direction);
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.priority) params.set('priority', query.priority);
    return params.toString();
  }
}
