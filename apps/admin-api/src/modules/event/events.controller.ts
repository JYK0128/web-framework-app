import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { AdminPermission } from '@pkg/shared';

import { InternalClient } from '#/core/internal-client';
import { CreateEventRequestDto } from '#/modules/event/create-event.request.dto';
import { CreateEventResponseDto } from '#/modules/event/create-event.response.dto';
import { DeleteEventRequestDto } from '#/modules/event/delete-event.request.dto';
import { DeleteEventResponseDto } from '#/modules/event/delete-event.response.dto';
import { GetEventsRequestDto } from '#/modules/event/get-events.request.dto';
import { GetEventsResponseDto } from '#/modules/event/get-events.response.dto';
import { UpdateEventRequestDto } from '#/modules/event/update-event.request.dto';
import { UpdateEventResponseDto } from '#/modules/event/update-event.response.dto';

@ApiTags('events')
@UserAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly client: InternalClient) {}
  @Permissions(AdminPermission.event.read)
  @SwaggerApiResponse(GetEventsResponseDto)
  @Get()
  list(@Query() query: GetEventsRequestDto): Promise<GetEventsResponseDto> {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    for (const sort of query.sort) params.append('sort[]', sort);
    for (const direction of query.direction) params.append('direction[]', direction);
    if (query.search) params.set('search', query.search);
    return this.client.fetch(`/internal/events?${params.toString()}`);
  }

  @Permissions(AdminPermission.event.create)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateEventResponseDto, HttpStatus.CREATED)
  create(@Body() input: CreateEventRequestDto): Promise<CreateEventResponseDto> { return this.client.fetch('/internal/events', { method: 'POST', body: input }); }

  @Permissions(AdminPermission.event.update)
  @Patch(':id')
  @SwaggerApiResponse(UpdateEventResponseDto)
  update(@Param('id') id: string, @Body() input: UpdateEventRequestDto): Promise<UpdateEventResponseDto> { return this.client.fetch(`/internal/events/${id}`, { method: 'PATCH', body: input }); }

  @Permissions(AdminPermission.event.delete)
  @Delete(':id')
  @SwaggerApiResponse(DeleteEventResponseDto)
  remove(@Param('id') id: string): Promise<DeleteEventResponseDto> {
    const request = DeleteEventRequestDto.parse({ eventId: id }).validate();
    return this.client.fetch(`/internal/events/${request.eventId}`, { method: 'DELETE' });
  }
}
