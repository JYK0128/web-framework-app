import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { InternalServiceClient } from '#/infra/auth/machine/internal-service-client.service';

import { GetQnaRequestDto, QnaActionResponseDto, QnaItemDto, QnaListResponseDto, UpdateQnaRequestDto } from './dto';

@ApiTags('qna') @UserAuth() @Controller('qna')
export class QnaController {
  constructor(private readonly internalClient: InternalServiceClient) {}
  @Get()
  @Permissions(Permission.qna.read)
  @SwaggerApiResponse(QnaListResponseDto)
  list(@Query() query: GetQnaRequestDto) {
    return this.internalClient.fetchServiceApi(`/api/v1/internal/qna?${this.params(query)}`);
  }

  @Get(':id')
  @Permissions(Permission.qna.read)
  @SwaggerApiResponse(QnaItemDto)
  get(@Param('id') id: string) {
    return this.internalClient.fetchServiceApi(`/api/v1/internal/qna/${id}`);
  }

  @Patch(':id')
  @Permissions(Permission.qna.update)
  @SwaggerApiResponse(QnaItemDto)
  update(@Param('id') id: string, @Body() input: UpdateQnaRequestDto) {
    return this.internalClient.fetchServiceApi(`/api/v1/internal/qna/${id}`, { method: 'PATCH', body: input });
  }

  @Delete(':id')
  @Permissions(Permission.qna.delete)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(QnaActionResponseDto)
  remove(@Param('id') id: string) {
    return this.internalClient.fetchServiceApi(`/api/v1/internal/qna/${id}`, { method: 'DELETE' });
  }

  private params(query: GetQnaRequestDto): string {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.priority) params.set('priority', query.priority);
    return params.toString();
  }
}
