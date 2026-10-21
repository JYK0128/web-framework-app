import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permissions, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';
import { AdminPermission } from '@pkg/shared';

import { InternalClient } from '~/core/internal-client';
import { DeleteQnaRequestDto } from '~/modules/qna/delete-qna.request.dto';
import { DeleteQnaResponseDto } from '~/modules/qna/delete-qna.response.dto';
import { GetQnaRequestDto } from '~/modules/qna/get-qna.request.dto';
import { GetQnaResponseDto } from '~/modules/qna/get-qna.response.dto';
import { GetQnasRequestDto } from '~/modules/qna/get-qnas.request.dto';
import { GetQnasResponseDto } from '~/modules/qna/get-qnas.response.dto';
import { UpdateQnaRequestDto } from '~/modules/qna/update-qna.request.dto';
import { UpdateQnaResponseDto } from '~/modules/qna/update-qna.response.dto';

@ApiTags('qna') @UserAuth() @Controller('qna')
export class QnaController {
  constructor(private readonly internalClient: InternalClient) {}

  @Get()
  @Permissions(AdminPermission.qna.read)
  @SwaggerApiResponse(GetQnasResponseDto)
  list(@Query() query: GetQnasRequestDto): Promise<GetQnasResponseDto> {
    return this.internalClient.fetch(`/internal/qna?${this.params(query)}`);
  }

  @Get(':id')
  @Permissions(AdminPermission.qna.read)
  @SwaggerApiResponse(GetQnaResponseDto)
  get(@Param('id') id: string): Promise<GetQnaResponseDto> {
    const request = GetQnaRequestDto.parse({ qnaId: id }).validate();
    return this.internalClient.fetch(`/internal/qna/${request.qnaId}`);
  }

  @Patch(':id')
  @Permissions(AdminPermission.qna.update)
  @SwaggerApiResponse(UpdateQnaResponseDto)
  update(@Param('id') id: string, @Body() input: UpdateQnaRequestDto): Promise<UpdateQnaResponseDto> {
    return this.internalClient.fetch(`/internal/qna/${id}`, { method: 'PATCH', body: input });
  }

  @Delete(':id')
  @Permissions(AdminPermission.qna.delete)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DeleteQnaResponseDto)
  remove(@Param('id') id: string): Promise<DeleteQnaResponseDto> {
    const request = DeleteQnaRequestDto.parse({ qnaId: id }).validate();
    return this.internalClient.fetch(`/internal/qna/${request.qnaId}`, { method: 'DELETE' });
  }

  private params(query: GetQnasRequestDto): string {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    for (const field of query.sort) params.append('sort[]', field);
    for (const direction of query.direction) params.append('direction[]', direction);
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.priority) params.set('priority', query.priority);
    return params.toString();
  }
}
