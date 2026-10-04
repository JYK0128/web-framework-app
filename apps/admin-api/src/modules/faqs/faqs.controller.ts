import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { InternalServiceClient } from '#/infra/auth/machine/internal-service-client.service';

import { CreateFaqRequestDto, FaqActionResponseDto, FaqItemDto, FaqPageResponseDto, GetFaqsRequestDto, UpdateFaqRequestDto } from './dto';

@ApiTags('faqs')
@UserAuth()
@Controller('faqs')
export class FaqsController {
  constructor(private readonly internalClient: InternalServiceClient) {}

  @ApiOperation({ summary: 'FAQ 목록 조회' })
  @Permissions(AdminPermission.faq.read)
  @SwaggerApiResponse(FaqPageResponseDto)
  @Get()
  async listFaqs(@Query() query: GetFaqsRequestDto): Promise<FaqPageResponseDto> {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    if (query.search) params.set('search', query.search);
    if (query.category) params.set('category', query.category);
    return this.internalClient.fetch(`/internal/faqs?${params.toString()}`);
  }

  @Post()
  @Permissions(AdminPermission.faq.create)
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(FaqItemDto, HttpStatus.CREATED)
  async createFaq(@Body() input: CreateFaqRequestDto): Promise<FaqItemDto> {
    return this.internalClient.fetch('/internal/faqs', { method: 'POST', body: input });
  }

  @Patch(':id')
  @Permissions(AdminPermission.faq.update)
  @SwaggerApiResponse(FaqItemDto)
  async updateFaq(@Param('id') id: string, @Body() input: UpdateFaqRequestDto): Promise<FaqItemDto> {
    return this.internalClient.fetch(`/internal/faqs/${id}`, { method: 'PATCH', body: input });
  }

  @Delete(':id')
  @Permissions(AdminPermission.faq.delete)
  @SwaggerApiResponse(FaqActionResponseDto)
  async deleteFaq(@Param('id') id: string): Promise<FaqActionResponseDto> {
    return this.internalClient.fetch(`/internal/faqs/${id}`, { method: 'DELETE' });
  }
}
