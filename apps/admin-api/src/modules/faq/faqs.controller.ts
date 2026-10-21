import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';
import { AdminPermission } from '@pkg/shared';

import { InternalClient } from '~/core/internal-client';
import { CreateFaqRequestDto } from '~/modules/faq/create-faq.request.dto';
import { CreateFaqResponseDto } from '~/modules/faq/create-faq.response.dto';
import { DeleteFaqRequestDto } from '~/modules/faq/delete-faq.request.dto';
import { DeleteFaqResponseDto } from '~/modules/faq/delete-faq.response.dto';
import { GetFaqsRequestDto } from '~/modules/faq/get-faqs.request.dto';
import { GetFaqsResponseDto } from '~/modules/faq/get-faqs.response.dto';
import { UpdateFaqRequestDto } from '~/modules/faq/update-faq.request.dto';
import { UpdateFaqResponseDto } from '~/modules/faq/update-faq.response.dto';

@ApiTags('faqs')
@UserAuth()
@Controller('faqs')
export class FaqsController {
  constructor(private readonly internalClient: InternalClient) {}

  @ApiOperation({ summary: 'FAQ 목록 조회' })
  @Permissions(AdminPermission.faq.read)
  @SwaggerApiResponse(GetFaqsResponseDto)
  @Get()
  async listFaqs(@Query() query: GetFaqsRequestDto): Promise<GetFaqsResponseDto> {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    for (const field of query.sort) params.append('sort[]', field);
    for (const direction of query.direction) params.append('direction[]', direction);
    if (query.search) params.set('search', query.search);
    if (query.category) params.set('category', query.category);
    return this.internalClient.fetch(`/internal/faqs?${params.toString()}`);
  }

  @Post()
  @Permissions(AdminPermission.faq.create)
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateFaqResponseDto, HttpStatus.CREATED)
  async createFaq(@Body() input: CreateFaqRequestDto): Promise<CreateFaqResponseDto> {
    return this.internalClient.fetch('/internal/faqs', { method: 'POST', body: input });
  }

  @Patch(':id')
  @Permissions(AdminPermission.faq.update)
  @SwaggerApiResponse(UpdateFaqResponseDto)
  async updateFaq(@Param('id') id: string, @Body() input: UpdateFaqRequestDto): Promise<UpdateFaqResponseDto> {
    return this.internalClient.fetch(`/internal/faqs/${id}`, { method: 'PATCH', body: input });
  }

  @Delete(':id')
  @Permissions(AdminPermission.faq.delete)
  @SwaggerApiResponse(DeleteFaqResponseDto)
  async deleteFaq(@Param('id') id: string): Promise<DeleteFaqResponseDto> {
    const request = DeleteFaqRequestDto.parse({ faqId: id }).validate();
    return this.internalClient.fetch(`/internal/faqs/${request.faqId}`, { method: 'DELETE' });
  }
}
