import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { InternalServiceClient } from '#/infra/auth/machine/internal-service-client.service';

import { CreateFaqRequestDto, FaqActionResponseDto, FaqItemDto, FaqListResponseDto, GetFaqsRequestDto, UpdateFaqRequestDto } from './dto';

@ApiTags('faqs')
@UserAuth()
@Controller('faqs')
export class FaqsController {
  constructor(private readonly internalClient: InternalServiceClient) {}

  @ApiOperation({ summary: 'FAQ 목록 조회' })
  @Permissions(Permission.faq.read)
  @SwaggerApiResponse(FaqListResponseDto)
  @Get()
  async listFaqs(@Query() query: GetFaqsRequestDto): Promise<FaqListResponseDto> {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    if (query.search) params.set('search', query.search);
    if (query.category) params.set('category', query.category);
    return this.internalClient.fetchServiceApi(`/api/v1/internal/faqs?${params.toString()}`);
  }

  @Post()
  @Permissions(Permission.faq.create)
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(FaqItemDto, HttpStatus.CREATED)
  async createFaq(@Body() input: CreateFaqRequestDto): Promise<FaqItemDto> {
    return this.internalClient.fetchServiceApi('/api/v1/internal/faqs', { method: 'POST', body: input });
  }

  @Patch(':id')
  @Permissions(Permission.faq.update)
  @SwaggerApiResponse(FaqItemDto)
  async updateFaq(@Param('id') id: string, @Body() input: UpdateFaqRequestDto): Promise<FaqItemDto> {
    return this.internalClient.fetchServiceApi(`/api/v1/internal/faqs/${id}`, { method: 'PATCH', body: input });
  }

  @Delete(':id')
  @Permissions(Permission.faq.delete)
  @SwaggerApiResponse(FaqActionResponseDto)
  async deleteFaq(@Param('id') id: string): Promise<FaqActionResponseDto> {
    return this.internalClient.fetchServiceApi(`/api/v1/internal/faqs/${id}`, { method: 'DELETE' });
  }
}
