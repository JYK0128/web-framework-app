import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { InternalServiceClient } from '#/infra/auth/machine/internal-service-client.service';

import { CreateEventRequestDto, EventActionResponseDto, EventItemDto, EventPageResponseDto, GetEventsRequestDto, UpdateEventRequestDto } from './events.dto';

@ApiTags('events')
@UserAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly client: InternalServiceClient) {}
  @Permissions(AdminPermission.event.read)
  @SwaggerApiResponse(EventPageResponseDto)
  @Get()
  list(@Query() query: GetEventsRequestDto): Promise<EventPageResponseDto> {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    for (const sort of query.sort) params.append('sort[]', sort);
    for (const direction of query.direction) params.append('direction[]', direction);
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    return this.client.fetch(`/internal/events?${params.toString()}`);
  }

  @Permissions(AdminPermission.event.create)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(EventItemDto, HttpStatus.CREATED)
  create(@Body() input: CreateEventRequestDto): Promise<EventItemDto> { return this.client.fetch('/internal/events', { method: 'POST', body: input }); }

  @Permissions(AdminPermission.event.update)
  @Patch(':id')
  @SwaggerApiResponse(EventItemDto)
  update(@Param('id') id: string, @Body() input: UpdateEventRequestDto): Promise<EventItemDto> { return this.client.fetch(`/internal/events/${id}`, { method: 'PATCH', body: input }); }

  @Permissions(AdminPermission.event.delete)
  @Delete(':id')
  @SwaggerApiResponse(EventActionResponseDto)
  remove(@Param('id') id: string): Promise<EventActionResponseDto> { return this.client.fetch(`/internal/events/${id}`, { method: 'DELETE' }); }
}
